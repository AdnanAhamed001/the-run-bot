# Hostd Menu Magic

The engine must not generate approximate layouts. It should create reusable template components (Vendor Profile, Gallery, Package Card, Menu Card, Add-On Card, Service Notes Card, Ready-To-Book Card) and populate them with vendor data.

# HOSTD CATALOGUE ENGINE – MASTER BUILD PROMPT

Build a web application called "Hostd Catalogue Engine".

The purpose of this application is to automatically convert catering vendor menus into standardized Hostd catering catalogues.

The user should upload:

1. Vendor Menu PDF
2. Vendor Images (optional)

The system should automatically:



Extract menu information


Extract packages


Extract package quantities


Extract pricing


Extract guest count requirements


Extract vendor details


Extract selection rules


Extract live stations


Extract add-ons



Then map everything into the Hostd catalogue framework and generate a catalogue that matches the uploaded Hostd template exactly.

The uploaded Hostd template is the visual source of truth.

Do not redesign.

Do not reinterpret.

Replicate the template exactly.

--------------------------------------------------

USER WORKFLOW

Step 1
Upload Vendor Menu PDF

Step 2
AI extracts vendor information

Step 3
AI converts vendor menu into Hostd standardized JSON

Step 4
AI renders catalogue automatically

Step 5
User previews catalogue

Step 6
User downloads PDF

The user should never see the JSON.

JSON should be an internal processing layer only.

--------------------------------------------------

HOSTD PAGE STRUCTURE

Always generate pages in this order.

Page 1
Vendor Profile

Page 2
Event Gallery

Page 3
Choose Your Package

Page 4+
Build Your Menu

Final Page

Add-Ons

Service Notes

Ready To Book

Terms & Conditions

--------------------------------------------------

PACKAGE GENERATION LOGIC

The number of package cards comes from the vendor.

Do not force every vendor into Signature, Premium and Luxe.

Examples:

Vendor has 1 package

Output:
Signature

Vendor has 2 packages

Output:
Signature
Luxe

Vendor has 3 packages

Output:
Signature
Premium
Luxe

Vendor has more than 3 packages

Retain all packages.

Do not remove package tiers.

Map packages from lowest to highest.

--------------------------------------------------

PACKAGE CONTENT RULE

Package cards contain quantities only.

Never display actual dish names.

Example:

✓ 1 Beverage
✓ 1 Soup
✓ 4 Starters
✓ 3 Main Course
✓ 1 Rice OR 1 Bread
✓ 2 Desserts

Dish names belong only in Build Your Menu pages.

--------------------------------------------------

STANDARD PACKAGE HEADINGS

Map vendor package content into these headings:

Beverages

Soups

Starters

Live Counters

Main Course

Assorted Breads

Accompaniments

Desserts

Do not expose vendor-specific package structures.

Standardize them.

--------------------------------------------------

VEG / NON-VEG LOGIC

If the vendor package contains separate Veg and Non-Veg package structures:

Display separate Veg and Non-Veg sections.

If the vendor package does not separate Veg and Non-Veg:

Use a single package content block.

Never invent Veg or Non-Veg sections.

Never display empty sections.

--------------------------------------------------

STANDARD CATEGORY HIERARCHY

Map menu items into:

Beverages

Beverage Accompaniments

Live Beverage Stations

Hot Beverages

Chaats

Street Food

Soups

Salads

Veg Starters

Non-Veg Starters

Premium Non-Veg Starters

Veg Main Course

Non-Veg Main Course

Dal

Rice

Assorted Breads

Accompaniments

Desserts

Ice Creams

Live Stations

Only display categories that contain content.

--------------------------------------------------

SELECTION RULE FORMAT

Always use:

SIGNATURE : Choose X

PREMIUM : Choose X

LUXE : Choose X

ALL PACKAGES : Choose X

Never use alternative wording.

--------------------------------------------------

TYPOGRAPHY

Page Headings

63px

Bold

Color:
#7B2D3A

----------------

Package Titles

40px

Bold

----------------

Category Headings

40px

Bold

----------------

Dish Names

28px

Semi Bold

----------------

Package Content

26px

Medium

----------------

Selection Rules

18px

Semi Bold

----------------

Body Text

20px

Regular

--------------------------------------------------

PAGE SPECIFICATIONS

Page Width
1080px

Page Height
1920px

Background
#F4F0EB

Content Width
980px

Left Margin
50px

Right Margin
50px

Top Margin
40px

Bottom Margin
40px

--------------------------------------------------

PAGE 1

Hero Image

980px × 400px

Border Radius
24px

About Card

980px Width

Minimum Height 260px

Padding 28px

Radius 24px

----------------

Cuisine Card

980px Width

110px Height

----------------

Formats Available Card

980px Width

220px Height

----------------

Speciality Pills

48px Height

999px Radius

--------------------------------------------------

PAGE 2

Gallery

2 Columns

4 Rows

8 Images

Image Size

478px × 340px

Radius 18px

Gap 24px

--------------------------------------------------

PACKAGE PAGE

Package Card Width

980px

Minimum Height

290px

Radius

24px

Padding

36px

Gap

28px

Stack vertically

--------------------------------------------------

Package Colors

Signature

#DCCBB8

Premium

#D7DDD8

Luxe

#E4D3A8

--------------------------------------------------

BUILD YOUR MENU PAGE

Card Width

980px

Minimum Height

260px

Padding

32px

Radius

24px

Background

#FBF8F4

Border

#E7DDD2

--------------------------------------------------

Selection Rule Pills

Height

48px

Radius

999px

Signature Pill

#DCCBB8

Premium Pill

#D7DDD8

Luxe Pill

#E4D3A8

All Packages Pill

#000000

--------------------------------------------------

FINAL PAGE

Add-On Cards

460px Width

120px Height

Radius 16px

----------------

Service Notes Card

980px Width

240px Minimum Height

Radius 24px

----------------

Ready To Book Card

980px Width

320px Height

Radius 28px

Gradient

#7B2D3A → #934455

----------------

Terms Card

980px Width

240px Minimum Height

Radius 24px

--------------------------------------------------

CONTENT RULES

Every dish from the vendor menu must appear.

No dish may be omitted.

No dish may be duplicated.

No category may be empty.

No package quantity may be invented.

No package quantity may be copied from another vendor.

Always derive quantities from vendor data.

--------------------------------------------------

PACKAGE STRUCTURE RULES

Use Hostd package naming.

However package count should come from the vendor.

1 Vendor Package
→ Signature

2 Vendor Packages
→ Signature + Luxe

3 Vendor Packages
→ Signature + Premium + Luxe

More than 3 Vendor Packages
→ Retain all package tiers

Never invent package tiers.

--------------------------------------------------

PDF EXPORT

Provide:



Catalogue Preview


Download PDF



PDF must preserve:



Page size


Typography


Layout


Card dimensions


Spacing



exactly.

--------------------------------------------------

VALIDATION CHECK

Before generating output:

✓ No missing dishes

✓ No missing packages

✓ No missing live stations

✓ No missing desserts

✓ No clipped text

✓ No overlapping text

✓ No empty categories

✓ Same dimensions as template

✓ Same typography as template

✓ Same layout as template

The final output should be visually indistinguishable from the uploaded Hostd template, with only the vendor content changed.

IMPORTANT:

Use the uploaded Hostd catalogue template as the visual source of truth and component library.

Measure and replicate:



Page structure


Layout


Typography hierarchy


Card hierarchy


Image placement


Spacing


Margins


Package page


Build Your Menu pages


Final page



exactly.

Only vendor content should change.

Use this uploaded catalogue as the visual reference and component library. Measure and replicate its layout exactly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://menu-maestro-engine.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39c93261-2040-4a28-af14-38d93e1210c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
