# ResQPlate

The name of our application is ResQPlate. It is a food donation platform that helps restaurants, cafes, bakeries and food businesses distribute leftover edible food with people in need.

## Problem Statement

Food insecurity and food waste are both serious problems nowadays; many people struggle to get affordable meals, while restaurants, bakeries and cafes often throw leftover edible food at the end of the day. Today, this problem is partly solved through food banks and donations programs. Apps such as Too Good To Go help businesses sell leftover food at discounted prices. However, discounted food may not help people who cannot afford to pay. Our app solves this problem by creating a donation-based dynamic platform where verified food businesses can post leftover food for free, and food seekers can find and receive available food nearby. This will help reduce food waste while making extra food accessible to people who need it.

## Final feature list

1. **Business Profile & Verification:** Restaurant, bakeries, cafes, and other business can create account and complete restaurant profiles using Google Places address autocomplete. Admin can review Business profiles, approve or reject businesses, request additional information, suspend account and can provide notes.

2. **Food Listing Creation:** Verified businesses can create, edit, or view food listing. They can manage listing quantity, upload image, cancel reservation, pickup time, location, and allergens for Food Seekers.

3. **Food search and reservation for food seekers:** Food seekers can create accounts and search for available listings near them, filter listings, reserve pickup time, and receive pickup code to confirm pickup and claim their food. They can search available listing through Algolia, filter by city, category, allergens, and based on distance. Seekers can select available one-hour pickup slot, view their reservation, or cancel eligible reservations.

4. **Pickup Management:** Businesses can view and manage reservations for their listing, can confirm pickup using codes, can mark no-show, can update reservation status, can search by food seeker email address.

## Local setup

For prerequisites, environment variables, database configuration, and instruction for runing app locally, see [Local Setup Guide](docs/setup.md).

## Architecture

Updated Architecture design: [`Architecture`](/docs/Architecture-diagram-ResQPlate.png)

## ER Diagram

Updated ER Diagram: [`ER Diagram`](/docs/ER_diagram.png)
