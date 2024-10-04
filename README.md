# Installation
Install instructions:

Tip: Right click links and then click "Open link in new tab". Tabs can be closed after doing the install.
1. Install a UserScript extension, such as [TamperMonkey on the Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo). Alternative (untested) extensions are ViolentMonkey and GreaseMonkey.
2. Open [MEC2Navigation Install](https://github.com/MECH2-at-Github/MEC2Navigation-PROD/raw/main/MEC2Navigation.user.js) and click the [ Install ] button
3. Install [Stylus](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne)
4. Open [MEC2Stylus](https://userstyles.world/style/13359/mec2stylus) and click the [ Install ] button to the bottom right of the image. On the next page, click the [ Install Style_] button in the upper left.
4. Done!

# Features
Primary Navigation buttons:
  * 3 rows of buttons are available to navigate MEC2. All buttons can be used to open a page in a new tab by right clicking on the button.
  * Row 1: Static, directly opens a page. The [ Case # ] field on the right is for a case number, and clicking [ Notes ] or [ Overview ] buttons opens the respective page in a new tab. Pressing enter opens CaseOverview.
  * Row 2: (Categories) Static, loads row 3 buttons. Does not directly open a page.
  * Row 3: (Page) Dynamic based on row 2 button. Directly opens a page.
	  * On page load, the category button and page button are highlighted.
* 'Opens in new tab' Case number field, along with two destination pages (Notes, Overview) at the top right of the Navigation buttons
  * Pressing enter after typing a case number selects 'CaseOverview'
* Period navigation buttons change periods without the select dropdown
  * « ‹ [Daterange - Dropdown] › »   (Previous+Submit, Previous [Dropdown] Next, Next+Submit)
* Period order in the dropdown is reversed to be most recent on top, and future periods are displayed without needing to scroll
