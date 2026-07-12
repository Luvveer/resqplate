#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; 
    then
        echo "Error: $ENV_FILE not found."
        exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

echo "Setting Project..."
gcloud config set project "$PROJECT_ID"

echo "Enabling APIs..."
gcloud services enable \
    sqladmin.googleapis.com \
    compute.googleapis.com \
    iam.googleapis.com \
    secretmanager.googleapis.com
echo "APIs enabled"

echo "Creating Cloud SQL instance usually takes some time."
if gcloud sql instances describe "$DB_INSTANCE" --quiet > /dev/null 2>&1; then
    echo "Instance $DB_INSTANCE already exists, skipping."
else
gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --no-backup \
    --no-storage-auto-increase \
    --edition=ENTERPRISE
echo "Cloud SQL instance is created."
fi

if gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE" --quiet > /dev/null 2>&1; then
    echo "Database $DB_NAME already exists, skipping."
else
    echo "Creating database and user..."
    gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"
    echo "Database is created."
fi

if gcloud sql users describe "$DB_USER" --instance="$DB_INSTANCE" --quiet > /dev/null 2>&1; then
    echo "User $DB_USER already exists, skipping."
else
    gcloud sql users create "$DB_USER" \
        --instance="$DB_INSTANCE" \
        --password="$DB_PASSWORD" 
    echo "Database and users is created."
fi

SERVICE_ACCOUNT_NAME="resqplate-vm"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --quiet >/dev/null 2>&1; then
    echo "service account $SERVICE_ACCOUNT_EMAIL already exists, skipping."
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" --display-name="Resqplate VM servce Account"
    echo "Service account created."
fi

echo "Granting Secret Manager access ..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --quiet > /dev/null 2>&1; then
    echo "VM $VM_NAME already exists, skipping."
else
    echo "Creating Virtual Machine....."
    gcloud compute instances create "$VM_NAME" \
        --machine-type=e2-small \
        --zone="$ZONE" \
        --image-family=ubuntu-2404-lts-amd64 \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=30GB \
        --boot-disk-type=pd-standard \
        --service-account="$SERVICE_ACCOUNT_EMAIL" \
        --tags=backend-server \
        --scopes=cloud-platform
    echo "VM instance created."
fi

echo "Secrets in Secret Manager..."

for SECRET_NAME in DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_URL FRONTEND_URL; do
    if gcloud secrets describe "$SECRET_NAME" --quiet > /dev/null 2>&1; then
        echo "Secret $SECRET_NAME already exists, skipping."
    else
        gcloud secrets create "$SECRET_NAME" --replication-policy="automatic"
        echo "Secret $SECRET_NAME created."
        case "$SECRET_NAME" in
            DATABASE_URL) echo -n "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=- ;;
            BETTER_AUTH_SECRET) echo -n "$BETTER_AUTH_SECRET" | gcloud secrets versions add BETTER_AUTH_SECRET --data-file=- ;;
            BETTER_AUTH_URL) echo -n "$BETTER_AUTH_URL" | gcloud secrets versions add BETTER_AUTH_URL --data-file=- ;;
            FRONTEND_URL) echo -n "$FRONTEND_URL" | gcloud secrets versions add FRONTEND_URL --data-file=- ;;
        esac
    fi
done

echo "setting up Firewall rules for port 3000.."
if gcloud compute firewall-rules describe allow-backend-3000 --quiet > /dev/null 2>&1; then
    echo "Firewall rule already exists, skipping."
else
    gcloud compute firewall-rules create allow-backend-3000 \
        --allow=tcp:3000 \
        --target-tags=backend-server \
        --description="Allow ResQPlate backend API on port 3000"
    echo "Firewall rules created and set."
fi

echo "Setting up VM internal IP in CloudSQL"
VM_IP=$(gcloud compute instances describe "$VM_NAME" \
    --zone="$ZONE" \
    --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
gcloud sql instances patch "$DB_INSTANCE" \
    --authorized-networks="$VM_IP"/32
echo "VM IP $VM_IP added in CloudSQL"

echo "Setting SSH key for installing requirements..."
if [ -f ~/.ssh/deploy_key ]; then
    echo "SSH already exists, skipping."
else
    ssh-keygen -t ed25519 -C "resqplate-deploy" -f ~/.ssh/deploy_key -N ""
fi

gcloud compute instances add-metadata "$VM_NAME" \
    --zone="$ZONE" \
    --metadata="ssh-keys=deploy:$(cat ~/.ssh/deploy_key.pub)"

echo "Waiting for VM to be ready..."
sleep 30

echo "Transferring and running VM setup script..."
scp -i ~/.ssh/deploy_key \
    -o StrictHostKeyChecking=no \
    scripts/setup-vm.sh \
    deploy@"$VM_IP":~/setup-vm.sh

ssh -i ~/.ssh/deploy_key \
    -o StrictHostKeyChecking=no \
    deploy@"$VM_IP" \
    "bash ~/setup-vm.sh"

echo "The required details of the cloud:"
DB_IP=$(gcloud sql instances describe "$DB_INSTANCE" \
    --format="value(ipAddresses[0].ipAddress)")
echo "VM External IP: $VM_IP"
echo "Cloud SQL IP: $DB_IP"
