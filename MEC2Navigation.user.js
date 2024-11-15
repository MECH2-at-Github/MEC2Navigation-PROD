// ==UserScript==
// @name         mec2navigation
// @namespace    http://github.com/MECH2-at-Github
// @description  Add functionality to MEC2 to improve navigation
// @author       MECH2
// @match        https://mec2.childcare.dhs.state.mn.us/*
// @version      0.2.1
// ==/UserScript==

'use strict';
// ("global elements list", "selectPeriod, save, pageWrap, "
// ("global strings list", "selectPeriodValue, inCurrentPeriod, userXnumber, !editMode, iFramed, focusEle, caseId, providerId (provider pages), caseOrProviderId, reviewingEligibility, thisPageName, thisPageNameHtm, slashThisPageNameHtm, doNotDupe, selectPeriodValue")
// longDateFormat,
// ("global object list", "countyInfo, userCountyObj, selectPeriodDates, stateData, ")
// ("global array list", "listPagesArray, ")
console.time('mec2functions load time');
document.getElementById('help')?.insertAdjacentHTML('afterend', '<a id="versionNumber" href="/ChildCare/PrivacyAndSystemSecurity.htm?from=mec2functions" target="_blank" style="margin-left: 10px;">' + GM_info.script.name + ' v' + GM_info.script.version+ '</a>'
                                                    + '<span class="tooltips" style="margin-left: 10px;">ⓘ<span style="width: 35ch;" id="mec2functionEnhancementsTooltip" class="tooltips-text tooltips-left">Click to show a list of enhancements by mec2functions on this page.</span></span>');
document.getElementById('mec2functionEnhancementsTooltip')?.addEventListener('click', function() { mec2functionsEnhancementsDialog.showModal(); document.getElementById('mec2functionsEnhancementsClose').select() });
const mec2functionEnhancements = {
    helpPrimaryNav: { title: 'Primary Navigation', desc: 'Buttons added to replace the drop-down menus for navigating MEC2.', selector: '.primary-navigation' },
    helpUserSettings: { title: 'User Settings', desc: 'Settings menu for mec2functions.', selector: '#mec2functionsDropdown' },
    helpAddedFeet: { title: 'Addtional Footer Links', desc: 'Links added to the footer of sites commonly used by CCAP workers. Some links are only found on specific pages, such as on the CaseTransfer page.', selector: '#footer_links' },
    helpNewTabField: { title: 'Open Case in New Tab', desc: 'An input field for a case number, with buttons that open the case in Notes or Overview. Pressing Enter opens Overview, and N opens Notes.', selector: '#buttonPanelOneNTF' },
    helpCaseHistory: { title: 'Case History', desc: 'A list of the last 10 cases opened. Includes the case name, number, and date with time.', selector: '#newTabField' },
    helpHotkeys: { title: 'Hotkeys', desc: 'Hotkeys to operate buttons. Hotkey combinations are "Alt" plus:\n(N)ew, (S)ave, (E)dit, (D)elete, (O)k, (C)ancel, (R)esend, (R)eturn, (W)rap-Up, (←) previous, (→) next.\n(Typically the first letter of the button.)' },
    helpAutoFocus: { title: 'Auto-Focus', desc: 'When loading a page, or with certain page changes, an item on the page is automatically "focused" so that it can be interacted with immediately. The selected item is designed to be the item most likely needing interaction.' },
    helpThemeColors: { title: 'Theme colors', desc: 'With the Stylus extension and MEC2Stylus installed, MEC2 theme colors are changed to light grays or black with dark gray. This follows the "color" chosen in the "System Colors" setting in Windows.' },
    help: {},
}
const mec2functionsEnhancementsDiv = `
<div class="container">
    <dialog class="helpOuter" id="mec2functionsEnhancementsDialog">
        <div class="helpInner" id="helpInner">
        </div>
        <div class="settingsButtons" id="mec2functionsEnhancementsButtons">
            <button class="cButton" type="button" id="mec2functionsEnhancementsClose">Close</button>
        </div>
    </dialog>
</div>`;
document.body.insertAdjacentHTML('beforeend', mec2functionsEnhancementsDiv);
const mec2functionsEnhancementsDialog = document.getElementById('mec2functionsEnhancementsDialog');
document.getElementById('mec2functionsEnhancementsClose')?.addEventListener('click', function() { mec2functionsEnhancementsDialog.close() });
const thisPageName = window.location.pathname.slice(11, window.location.pathname.lastIndexOf(".htm")), thisPageNameHtm = thisPageName + ".htm";
if ( "Welcome.htm".includes(thisPageNameHtm) ) { location.assign("Alerts.htm"); return; }; //auto-redirect from Welcome to Alerts
//
document.querySelector('div.container:has(form)')?.insertAdjacentHTML('afterbegin', '<div id="noticeDiv"></div>');
const countyInfo = {
    info: { ...JSON.parse( localStorage.getItem('MECH2.countyInfo') ) } ?? {},
    userSettings: { ...JSON.parse( localStorage.getItem('MECH2.userSettings') ) } ?? {},
    updateCountyInfoLS(countyInfoKey, countyInfoValue) { // keyName, newValue or "delete"
        countyInfoValue === "delete" ? delete this.info[countyInfoKey] : this.info[countyInfoKey] = countyInfoValue
        localStorage.setItem( 'MECH2.countyInfo', JSON.stringify(this.info) )
    },
    updateUserSettingsLS(userSettingsKey, userSettingsValue) {
        this.userSettings[userSettingsKey] = userSettingsValue
        localStorage.setItem( 'MECH2.userSettings', JSON.stringify(this.userSettings) )
    },
    countyInfoPrompt(questionString, countyInfoKey) {
        let promptAnswer = prompt(questionString)
        if (promptAnswer) {
            this.updateCountyInfoLS(countyInfoKey, promptAnswer)
        }
        return promptAnswer
    },
}; // function_and_values
if (localStorage.getItem('MECH2.userIdNumber')) { countyInfo.updateCountyInfoLS('userIdNumber', localStorage.getItem('MECH2.userIdNumber')); localStorage.removeItem('MECH2.userIdNumber') };
if (localStorage.getItem('MECH2.closedCaseBank')) { countyInfo.updateCountyInfoLS('closedCaseBank', localStorage.getItem('MECH2.closedCaseBank')); localStorage.removeItem('MECH2.closedCaseBank') };
const newFeatureNotice = { // reset after version 0.5.__:
    noticeDiv: document.getElementById('noticeDiv'),
    noticesToUsers: [ // [ lsValue, [ textArray ], omittedTrueFalse ] // new user settings: param1 = setting 'id', true/false = defaulted to on/off, omit to just be a notice instead of user setting
        ["workerRole", ["Notice: Worker Role can be changed via the mec2functions drop-down (in the upper right).", "Currently, switching roles only changes the button order for Primary Navigation's second row."],],
        ["eleFocus", ["Notice: New user setting available and defaulted to On.", "New setting: Auto-focus on a field at page load."], true],
        ["caseHistory", ["Notice: New user setting available and defaulted to On.", "New setting: Case History"], true],
        ["actualDateStorage", ["Notice: New user setting available and defaulted to On.", "New setting: Actual Date & Begin Date auto-fill."], true],
        ["selectPeriodReversal", ["Notice: New user setting available and defaulted to On.", "New setting: 'Select Period' drop-down order set to 'Descending.'"], true],
        ["duplicateFormButtons", ["Notice: New user setting available and defaulted to On.", "New setting: Form buttons are duplicated at the top of the page (Save, Edit, etc.)."], true],
        ["fundsAvailable", ["Notice: New user setting available and defaulted to On.", "New setting: Auto-select Yes on the Funding Availability page."], true],
        ["autoHideDatePicker", ["Notice: New user setting available and defaulted to Off.", "New setting: Auto-hide the date picker calendar popup until a date field is clicked. Resets to saved setting when a page is loaded."], false],
        ["starFall", ["Notice: New user setting available and defaulted to Off.", "New setting: Starfall. Note: MECH2 is not liaible for lost work time or for your computer melting due to usage of Starfall."], false],
    ],
    noticeToUsers(lsValue, textArray, newUserSetting) {
        if (!this.noticeDiv) { return };
        let noticeToUsersLS = testIfValidJSON( localStorage.getItem('MECH2.noticeToUsersLS') ) ?? {}
        let textString = textArray.map(item => '<strong class="rederrortext mec2functions" style="display: block;">' + item + '</strong>').join('')
        if ( !(lsValue in noticeToUsersLS) ) {
            if (newUserSetting !== undefined) { countyInfo.updateUserSettingsLS(lsValue, newUserSetting) }
            this.noticeDiv.insertAdjacentHTML('beforeend', ''
                                         + '<div id=' + lsValue + ' class="error_alertbox_new">'
                                         + '<span class="float-right-imp" style="cursor: pointer; color: black !important;">✖</span>'
                                         + textString
                                         + '</div>')
        }
        this.noticeDiv.addEventListener('click', function(clickEvent) {
            let targetParent = clickEvent.target.parentElement
            if (!targetParent.classList.contains('error_alertbox_new') ) { return }
            noticeToUsersLS[targetParent.id] = GM_info.script.version
            for (let storedValue in noticeToUsersLS) {
                if ( ( noticeToUsersLS[storedValue] !== GM_info.script.version) ) { delete noticeToUsersLS[storedValue] }
            }
            localStorage.setItem( 'MECH2.noticeToUsersLS', JSON.stringify(noticeToUsersLS) )
            targetParent.remove()
        })
    },
}; // function_and_values
newFeatureNotice.noticesToUsers.map( ([lsValue, textArray, newUserSetting]) => newFeatureNotice.noticeToUsers(lsValue, textArray, newUserSetting) );
//
const pageWrap = document.getElementById('page-wrap'), save = document.getElementById('save'), editMode = pageWrap && ( save ? save.disabled : true) ? false : true, appMode = editMode && save?.disabled ? true : false;
const iFramed = window.location !== window.parent.location;
const longDateFormat = '{day: "2-digit", month: "2-digit", year: "numeric"}';
let focusEle = "blank";
//
const caseIdElement = document.getElementById('caseId'), caseId = caseIdElement?.value;
const providerIdElement = document.querySelector('#providerInput > #providerId'), providerId = providerIdElement?.value;
const caseOrProviderId = caseId ?? providerId;
const pageTitle = document.querySelector('title').innerText;
const submitButton = document.querySelector('#submit, #caseInputSubmit, #alertInputSubmit, #submitProviderId, #providerIdSubmit');
//
!function navButtonDivs() {
    try {
        let greenline = document.querySelector(".line_mn_green") ?? undefined
        if (greenline) {
            greenline.closest('.container')?.insertAdjacentHTML('afterend', `
	<nav class="navigation container">
		<div class="primary-navigation">
			<div class="primary-navigation-row">
				<div id="buttonPanelOne"></div>
				<div id="buttonPanelOneNTF"></div>
			</div>
			<div class="primary-navigation-row">
				<div id="buttonPanelTwo"></div>
			</div>
			<div class="primary-navigation-row">
				<div id="buttonPanelThree"></div>
			</div>
		</div>
		<div id="secondaryActionArea"><div id="duplicateButtons" class="db-container"></div></div>
	</nav>
		`)
        }
    } catch(error) { console.trace(error) };
}();
const secondaryActionArea = document.getElementById('secondaryActionArea'), duplicateButtons = document.getElementById('duplicateButtons');
//
if (localStorage.getItem('MECH2.userName')) { countyInfo.updateCountyInfoLS( 'userName', localStorage.getItem('MECH2.userName') ); localStorage.removeItem('MECH2.userName') }; // updating to new system, can remove after pushed to Prod
//
const workerRole = countyInfo.info.workerRole ?? "mec2functionsFinancialWorker";
!function userSettingDivs() {
    if (iFramed || editMode) { return }; // User_Settings_Divs // code to check for affirmative setting is 'if (userSettings.settingId)'
    try {
        let isNavOnly = GM_info.script.name === "mec2navigation" ? '<div>Notice: Some settings, while available to change here, are only applicable to the full version (mec2functions)</div>' : ''
        document.getElementById('Claim Establishment').parentElement.classList.add('sub_menu')
        document.querySelector('.navigation')?.insertAdjacentElement('beforebegin', pageWrap);
        pageWrap.classList.add('container')
        document.body.insertAdjacentHTML('beforeend', `
        <div class="container">
            <dialog class="settingsOuter" id="mec2functionsSettings">
                <div class="settingsInner" id="settingsInner">`
                    + isNavOnly
                    + '<div class="settings-div"><label class="settings-label" title="Automatic field focus on page load">Page Load Focus</label><label class="switch"><input type="checkbox" id="eleFocus"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Creates duplicated form \"Action\" buttons at top of page. e.g., Save, Edit.">Duplicated Form Action Buttons</label><label class="switch"><input type="checkbox" id="duplicateFormButtons"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Sets Period Order drop-downs so that newest dates are on top.">Descending Period Order</label><label class="switch"><input type="checkbox" id="selectPeriodReversal"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Displays last 10 unique cases in the Navigation Buttons \'Case #\' field.">Case History</label><label class="switch"><input type="checkbox" id="caseHistory"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Fills Actual Date and Start Date fields, if date known.">Actual Date Auto-Fill</label><label class="switch"><input type="checkbox" id="actualDateStorage"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Auto-selects Yes on the Funding Availability page.">Funds Available: Yes</label><label class="switch"><input type="checkbox" id="fundsAvailable"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Auto-hide the date picker calendar popup until a date field is clicked. Resets to saved setting when a page is loaded.">Auto-hide datepicker calendar</label><label class="switch"><input type="checkbox" id="autoHideDatePicker"><span class="slider round"></span></label></div>'
                    // + '<div class="settings-div"><label class="settings-label" title="__TITLE__">__LABEL__</label><label class="switch"><input type="checkbox" id="__ID__"><span class="slider round"></span></label></div>'
                    + '<div class="settings-div"><label class="settings-label" title="Pretty stars appear when the cursor is moved. MECH2 is not responsible for lost work time due to Starfall.">Starfall ✨</label><label class="switch"><input type="checkbox" id="starFall"><span class="slider round"></span></label></div>'
                + `</div>
                <div class="settingsButtons" id="mec2functionsSettingsButtons">
                    <button class="cButton" type="button" id="mec2functionsSave">Save</button>
                    <button class="cButton" type="button" id="mec2functionsClose">Close</button>
                </div>
            </dialog>
        </div>
        `)
        let mec2functionsSettingsDialog = document.getElementById('mec2functionsSettings')
        document.getElementById('mec2functionsSettingsButtons').addEventListener('click', function(clickEvent) {
            if (clickEvent.target.nodeName !== "BUTTON") { return }
            if (clickEvent.target.id === "mec2functionsSave") {
                let userSettingsInputs = [...document.querySelectorAll('#settingsInner input')]
                userSettingsInputs.forEach(ele => countyInfo.updateUserSettingsLS(ele.id, ele.checked) )
                snackBar('Page must be reloaded before settings are applied.', 'Settings Saved!')
            }
            mec2functionsSettingsDialog.close()
        })

        let mec2functionsSettings = ''
        + '<a href="#">mec2functions</a>'
        + '<ul class="sub_menu" style="width: fit-content;" id="mec2functionsSubMenu">'
            + '<li><a href="#" id="mec2functionsFinancialWorker">Financial Worker</a>'
            + '<li><a href="#" id="mec2functionsPaymentWorker">Payment Worker</a>'
            + '<li><a href="#" id="mec2functionsProviderWorker">Provider Worker</a>'
            + '<li><a href="#" id="mec2functionsOpen">mec2functions Settings</a>'
        + '</ul>'
        let mec2functionsDropdown = document.createElement('li')
        mec2functionsDropdown.id = "mec2functionsDropdown"
        mec2functionsDropdown.innerHTML = mec2functionsSettings
        document.querySelector('ul.dropdown').append(mec2functionsDropdown)
        let mec2functionsSubMenu = document.getElementById('mec2functionsSubMenu')
        mec2functionsDropdown.addEventListener('click', function(clickEvent) {
            if (clickEvent.target.nodeName !== "A") { return }
            mec2functionsSubMenu.style.visibility = "hidden"
            if (clickEvent.target.id.indexOf("Worker") > -1) { countyInfo.updateCountyInfoLS('workerRole', clickEvent.target.id) }
            if (clickEvent.target.id === "mec2functionsOpen") {
                let userSettingsInputs = [...document.querySelectorAll('#settingsInner input')]
                userSettingsInputs.forEach(function(ele) { ele.checked = countyInfo.userSettings[ele.id] ?? false })
                mec2functionsSettingsDialog.showModal()
            }
        })
    }
    catch (error) { console.trace(error) }
    finally { document.documentElement.style.setProperty('--mainPanelMovedDown', '0') }
}();
//
const h4objects = h4list();
function h4list() { // h4elementText: { h4element, indexNumber, siblings }
    class h4object {
        constructor(h4) {
            this.h4 = h4;
            this.text = h4.textContent.replace(/\W/g, '').toLowerCase();
            this.h4parentChildren = h4.parentElement.children;
            this.indexNumber = [...this.h4parentChildren].indexOf(h4);
            this.siblings = [];
            this.h4siblingsFunc();
            return this
        }
        h4siblingsFunc() {
            let h4nextSiblings = []
            for (let child of this.h4parentChildren) {
                if ( child === this.h4 || ['SCRIPT', 'STYLE', 'BR', 'NAV'].includes(child.nodeName) ) { continue }
                if (!child || child.nodeName === "H4") { break }
                this.siblings.push(child)
            }
        }
    }
    let h4objectsQuery = [...document.getElementsByTagName('h4')]
    let h4objectsObj = {}
    h4objectsQuery.forEach(function(h4) {
        let h4collection = new h4object(h4)
        h4objectsObj[h4collection.text] = h4collection
    })
    return h4objectsObj
};
!function h4clickyCollapse() {
    if (iFramed) { return }
    try {
        for (let h4prop in h4objects) {
            h4objects[h4prop].h4.addEventListener('click', function() {
                h4objects[h4prop].siblings.forEach( ele => ele.classList.toggle('hidden') )
            })
        }
    } catch(err) { console.trace(err) }
}();
//
const reviewingEligibility = (thisPageNameHtm.indexOf("CaseEligibilityResult") > -1 && thisPageNameHtm.indexOf("CaseEligibilityResultSelection.htm") < 0);
const selectPeriod = document.getElementById('selectPeriod'), selectPeriodValue = selectPeriod?.value;
const selectPeriodDates = selectPeriodValue?.length ? { range: selectPeriodValue, parm3: selectPeriodValue.replace(' - ', '').replaceAll('/', ''), start: selectPeriodValue.slice(0, 10), end: selectPeriodValue.slice(13) } : {};
const getListAndAlertTableParameters = { // Parameters for navigating from Alerts or Lists, and the column
    parameterTwo(tableData) {
        let dataFromMap = tableData.get(thisPageNameHtm) ?? ['table > tbody', 0]
        let mappedRowChildren = document.querySelector(dataFromMap[0] + '> tr.selected')?.children
        if (!mappedRowChildren) { return }
        return mappedRowChildren[dataFromMap[1]]?.textContent
    },
    case() {
        const tableMap = new Map([
            ["Alerts.htm", ["table#caseOrProviderAlertsTable > tbody", 2] ],
            ["ClientSearch.htm", ['table#clientSearchProgramResults > tbody', 0] ],
            ["ServicingAgencyIncomingTransfers.htm", ['table#incomingTransfersTable > tbody', 5] ],
            ["ServicingAgencyOutgoingTransfers.htm", ['table#outgoingTransfersTable > tbody', 5] ],
            ["BillsList.htm", ['table#billsTable > tbody', 0] ],
        ])
        let param2 = this.parameterTwo(tableMap)
        if (!param2 || !Number(param2)) { return '?parm2=' }
        let param3 = "Alerts.htm".includes(thisPageNameHtm) ? '&parm3=' + (document.getElementById('periodBeginDate')?.value + document.getElementById('periodEndDate')?.value).replace(/\//g, '')
        : "BillsList.htm".includes(thisPageNameHtm) ? '&parm3=' + (document.querySelector('table#billsTable > tbody > tr.selected > td:nth-child(5)').textContent).replace(/[\/\- ]/g, '')
        : ''
        return '?parm2=' + param2 + param3
    },
    provider() {
        const providerTableMap = new Map([
            ["Alerts.htm", ["table#caseOrProviderAlertsTable > tbody", 3] ],
            ["ProviderRegistrationList.htm", ['table#providerRegistrationTable > tbody', 2] ],
            ["ProviderSearch.htm", ['table#providerSearchTable > tbody', 1] ],
            ["BillsList.htm", ['table#billsTable > tbody', 3] ],
        ])
        let providerTableFromMap = providerTableMap.get(thisPageNameHtm) ?? undefined
        if (!providerTableFromMap) { return undefined }
        let parameter2alerts = document.querySelector(providerTableFromMap[0] + ' > tr > td:nth-of-type(2)') === null ? '' : '?providerId=' + document.querySelector(providerTableFromMap[0] + ' > tr.selected > td:nth-of-type(' + providerTableFromMap[1] + ')')?.textContent
        return parameter2alerts
    },
}; // function_and_values
let newTabField
const doNotDupeArr = []
//
document.body.insertAdjacentHTML('beforeend', '<div id="snackBarDiv"></div>'); // snack_bar start
function snackBar(text, title = "Copied!", textAlign = "left") {
    let snackBarDiv = document.getElementById('snackBarDiv')
    snackBarDiv.replaceChildren()
    let snackBarTxt = ""
    if (title !== 'notitle') { snackBarTxt += "<span class='snackBar-title'>" + title + "</span>" }
    let snackBarTextArray = text.split('\n')
    for (const line of snackBarTextArray) {
        snackBarTxt += "<span>" + line + "</span>";
    }
    snackBarDiv.insertAdjacentHTML('beforeend', '<div class="snackBar">' + snackBarTxt + '</div>')
    setTimeout(function() { snackBarDiv.children[0].classList.add('snackBar-hide'); }, 1);
}; // snack_bar end
const sanitize = {
    evalText(text) { return text.replace(/\\/g,'').trim() },
    query(query) {
        if (!query) { return }
        function getSanitizedQuery(queryInput) {
            let sanitizedQuery
            if (typeof queryInput === "string") {
                let queryFromTextInput = queryInput.indexOf(',') === -1 && queryInput.indexOf('#') === 0 ? document.getElementById(queryInput.slice(1)) : document.querySelectorAll(queryInput)
                sanitizedQuery = queryFromTextInput instanceof HTMLElement || queryFromTextInput instanceof NodeList ? queryFromTextInput : undefined
            } else { sanitizedQuery = queryInput }
            return sanitizedQuery
        }
        if (!(typeof query === "string" || query instanceof HTMLElement || query instanceof NodeList)) {
            console.trace("sanitize.query: argument 1 invalid (" + query + ") - must be a valid query string, an HTMLElement, or a NodeList")
            return
        }
        return getSanitizedQuery(query)
    }
};
function testIfValidJSON(obj) {
    try { return JSON.parse(obj) }
    catch (err) { return undefined }
};
function getTableRow(ele) {
    if (!sanitize.query(ele)) { return };
    while ( !["TR", "TBODY"].includes(ele.nodeName) ) { ele = ele.parentElement }
    if (ele.nodeName === "TBODY") { return undefined }
    return ele
};
function docReady(fn) {
    if (["complete", "interactive"].includes(document.readyState)) {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
};
//
if (!editMode) { document.getElementById('Report\ a\ Problem')?.children[0]?.setAttribute('target', '_blank'); document.getElementById('Maximum\ Rates')?.children[0]?.setAttribute('target', '_blank'); }; //change_to_open_in_new_tab
document.querySelector('h1')?.closest('div.row')?.classList.add('h1-parent-row');
!function keepSelectedTableRowOnClick() { //Fix for table entries losing selected class when clicked on.
    if (iFramed) { return };
    document.querySelectorAll('tbody').forEach(tbody => {
        tbody.addEventListener('click', (clickEvent) => {
            let closestTr = getTableRow(clickEvent.target)
            if (closestTr && !closestTr.classList.contains('selected') ) {
                closestTr.parentElement.querySelector('.selected')?.classList.remove('selected')
                closestTr?.classList.add('selected')
            }
        })
    })
}();
// ====================================================================================================
// /////////////////////////////////// SECTION_START CUSTOM_NAVIGATION \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ====================================================================================================
// ====================================================================================================
// ///////////////////////////// PRIMARY_NAVIGATION_BUTTONS SECTION_START \\\\\\\\\\\\\\\\\\\\\\\\\\\\\
!function navigationButtons() {
    const searchIcon = "<span style='font-size: 80%; margin-left: 2px;'>🔍</span>";
    const navMaps = {
        rowMap: new Map([
            [ "rowOne", [ "Alerts.htm", "CaseNotes.htm", "CaseOverview.htm", "CasePageSummary.htm", "ClientSearch.htm", "ProviderSearch.htm", "ActiveCaseList.htm", "PendingCaseList.htm", "InactiveCaseList.htm", "CaseApplicationInitiation.htm", ] ],
        ]),
        rowPagesMap: new Map([
            [ "Member.btn", [ "CaseMember.htm", "CaseMemberII.htm", "CaseParent.htm", "CaseCSE.htm", "CaseSchool.htm", "CaseChildProvider.htm", "CaseSpecialNeeds.htm", "CaseDisability.htm", "CaseFraud.htm", "CaseImmigration.htm", "CaseAlias.htm", "CaseRemoveMember.htm", "CaseMemberHistory.htm" ], ],
            [ "Case.btn", [ "CaseEditSummary.htm", "CaseAddress.htm", "CaseAction.htm", "FundingAvailability.htm", "CaseRedetermination.htm", "ApplicationInformation.htm", "CaseReinstate.htm" ], ],
            [ "Activity_and_Income.btn", [ "CaseEarnedIncome.htm", "CaseUnearnedIncome.htm", "CaseLumpSum.htm", "CaseExpense.htm", "CaseEducationActivity.htm", "CaseEmploymentActivity.htm", "CaseSupportActivity.htm", "CaseJobSearchTracking.htm" ], ],
            [ "Eligibility.btn", [ "CaseEligibilityResultSelection.htm", "CaseEligibilityResultOverview.htm", "CaseEligibilityResultFamily.htm", "CaseEligibilityResultPerson.htm", "CaseEligibilityResultActivity.htm", "CaseEligibilityResultFinancial.htm", "CaseEligibilityResultApproval.htm", "CaseCreateEligibilityResults.htm" ], ],
            [ "SA.btn", [ "CaseServiceAuthorizationOverview.htm", "CaseCopayDistribution.htm", "CaseServiceAuthorizationApproval.htm", "CaseCreateServiceAuthorizationResults.htm" ], ],
            [ "Notices.btn", [ "CaseNotices.htm", "CaseSpecialLetter.htm", "CaseMemo.htm" ], ],
            [ "Provider_Info.btn", [ "ProviderOverview.htm", "ProviderNotes.htm", "ProviderInformation.htm", "ProviderAddress.htm", "ProviderParentAware.htm", "ProviderAccreditation.htm", "ProviderTraining.htm", "ProviderRates.htm", "ProviderLicense.htm", "ProviderAlias.htm", "ProviderBackgroundStudy.htm", "ProviderFeesAndAccounts.htm", "ProviderRegistrationAndRenewal.htm", "ProviderTaxInfo.htm", "ProviderPaymentHistory.htm" ], ],
            [ "Provider_Notices.btn", [ "ProviderNotices.htm", "ProviderSpecialLetter.htm", "ProviderMemo.htm" ], ],
            [ "Pro.btn", [ "ProviderProUserAccess.htm", "ProUserDetail.htm", "ProUserSearch.htm", "ProUserProviderRelationship.htm", "ProUserResetPassword.htm" ], ],
            [ "Billing.btn", [ "FinancialBilling.htm", "FinancialBillingApproval.htm", "BillsList.htm", "ElectronicBills.htm", "CasePaymentHistory.htm", "FinancialAbsentDayHolidayTracking.htm", "FinancialBillingRegistrationFeeTracking.htm", "FinancialManualPayment.htm" ], ],
            [ "CSI.btn", [ "CaseCSIA.htm", "CaseCSIB.htm", "CaseCSIC.htm", "CaseCSID.htm" ], ],
            [ "Transfer.btn", [ "CaseTransfer.htm", "ServicingAgencyIncomingTransfers.htm", "ServicingAgencyOutgoingTransfers.htm", "FinancialClaimTransfer.htm", "ProviderTransfer.htm", "TransferWorkloadCase.htm", "TransferWorkloadClaim.htm", "ProviderWorkloadTransfer.htm" ], ],
            [ "Claims.btn", [ "FinancialClaimEstablishment.htm", "FinancialClaimMaintenanceAmountDetails.htm", "FinancialClaimMaintenanceSummary.htm", "FinancialClaimNoticeOverpaymentText.htm", "FinancialClaimNotes.htm", "FinancialClaimNotices.htm", "ProviderFraud.htm", "FinancialClaimMaintenanceCase.htm", "FinancialClaimMaintenancePerson.htm", "FinancialClaimMaintenanceProvider.htm" ], ],
        ]),
        allPagesMap: new Map([
            [ "Alerts.htm", { label: "Alerts", target: "_self", parentId: "Alerts", row: "1" }, ],
            [ "CaseNotes.htm", { label: "Notes", target: "_self", parentId: "Case Notes", row: "1" }, ],
            [ "CaseOverview.htm", { label: "Overview", target: "_self", parentId: "Case Overview", row: "1" }, ],
            [ "CasePageSummary.htm", { label: "Summary", target: "_self", parentId: "Page Summary", row: "1" }, ],
            [ "ClientSearch.htm", { label: "Client " + searchIcon, target: "_self", parentId: "Client Search", row: "1" }, ],
            [ "ProviderSearch.htm", { label: "Provider " + searchIcon, target: "_self", parentId: "Provider Search", row: "1" }, ],
            [ "ActiveCaseList.htm", { label: "Active", target: "_self", parentId: "Active Caseload List", row: "1" }, ],
            [ "PendingCaseList.htm", { label: "Pending", target: "_self", parentId: "Pending Case List", row: "1" }, ],
            [ "InactiveCaseList.htm", { label: "Inactive", target: "_self", parentId: "Inactive Case List", row: "1" }, ],
            [ "CaseApplicationInitiation.htm", { label: "New App", target: "_self", parentId: "Case Application Initiation", row: "1" }, ],

            [ "CaseMember.htm", { label: "Member I", target: "_self", parentId: "Member", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseMemberII.htm", { label: "Member II", target: "_self", parentId: "Member II", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseParent.htm", { label: "Parent", target: "_self", parentId: "Parent", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseCSE.htm", { label: "CSE", target: "_self", parentId: "Child Support Enforcement", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseSchool.htm", { label: "School", target: "_self", parentId: "School", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseChildProvider.htm", { label: "Provider", target: "_self", parentId: "Child Provider", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseSpecialNeeds.htm", { label: "Special Needs", target: "_self", parentId: "Special Needs", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseDisability.htm", { label: "Disability", target: "_self", parentId: "Disability", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseFraud.htm", { label: "Fraud", target: "_self", parentId: "Case Fraud", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseImmigration.htm", { label: "Immigration", target: "_self", parentId: "Immigration", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseAlias.htm", { label: "Alias", target: "_self", parentId: "Case Alias", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseRemoveMember.htm", { label: "Remove", target: "_self", parentId: "Remove a Member", rowTwoParent: "Member.btn", row: "3", }, ],
            [ "CaseMemberHistory.htm", { label: "History", target: "_self", parentId: "Member History", rowTwoParent: "Member.btn", row: "3", }, ],

            [ "CaseEarnedIncome.htm", { label: "Earned", target: "_self", parentId: "Earned Income", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseUnearnedIncome.htm", { label: "Unearned", target: "_self", parentId: "Unearned Income", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseLumpSum.htm", { label: "Lump Sum", target: "_self", parentId: "Lump Sum", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseExpense.htm", { label: "Expenses", target: "_self", parentId: "Expenses", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseEducationActivity.htm", { label: "Education", target: "_self", parentId: "Education Activity", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseEmploymentActivity.htm", { label: "Employment", target: "_self", parentId: "Employment Activity", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseSupportActivity.htm", { label: "Support", target: "_self", parentId: "Support Activity", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],
            [ "CaseJobSearchTracking.htm", { label: "Job Search", target: "_self", parentId: "Job Search Tracking", rowTwoParent: "Activity_and_Income.btn", row: "3", }, ],

            [ "CaseEditSummary.htm", { label: "Edit Summary", target: "_self", parentId: "Edit Summary", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "CaseAddress.htm", { label: "Address", target: "_self", parentId: "Case Address", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "CaseAction.htm", { label: "Case Action", target: "_self", parentId: "Case Action", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "FundingAvailability.htm", { label: "Funding Availability", target: "_self", parentId: "Funding Availability", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "CaseRedetermination.htm", { label: "Redetermination", target: "_self", parentId: "Case Redetermination", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "ApplicationInformation.htm", { label: "Application Info", target: "_self", parentId: "Case Application Info", rowTwoParent: "Case.btn", row: "3", }, ],
            [ "CaseReinstate.htm", { label: "Reinstate", target: "_self", parentId: "Reinstate", rowTwoParent: "Case.btn", row: "3", }, ],

            [ "CaseEligibilityResultSelection.htm", { label: "Selection", target: "_self", parentId: "Eligibility Results Selection", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultOverview.htm", { label: "Overview", target: "_self", parentId: "Results Overview", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultFamily.htm", { label: "Family", target: "_self", parentId: "Family Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultPerson.htm", { label: "Person", target: "_self", parentId: "Person Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultActivity.htm", { label: "Activity", target: "_self", parentId: "Activity Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultFinancial.htm", { label: "Financial", target: "_self", parentId: "Financial Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseEligibilityResultApproval.htm", { label: "Approval", target: "_self", parentId: "Approval Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],
            [ "CaseCreateEligibilityResults.htm", { label: "Create Eligibility Results", target: "_self", parentId: "Create Eligibility Results", rowTwoParent: "Eligibility.btn", row: "3", }, ],

            [ "CaseServiceAuthorizationOverview.htm", { label: "Overview", target: "_self", parentId: "Service Authorization Overview", rowTwoParent: "SA.btn", row: "3", }, ],
            [ "CaseCopayDistribution.htm", { label: "Copay", target: "_self", parentId: "Copay Distribution", rowTwoParent: "SA.btn", row: "3", }, ],
            [ "CaseServiceAuthorizationApproval.htm", { label: "Approval", target: "_self", parentId: "Service Authorization Approval", rowTwoParent: "SA.btn", row: "3", }, ],
            [ "CaseCreateServiceAuthorizationResults.htm", { label: "Create SA", target: "_self", parentId: "Create Service Authorization Results", rowTwoParent: "SA.btn", row: "3", }, ],

            [ "CaseCSIA.htm", { label: "CSIA", target: "_self", parentId: "CSIA", rowTwoParent: "CSI.btn", row: "3", }, ],
            [ "CaseCSIB.htm", { label: "CSIB", target: "_self", parentId: "CSIB", rowTwoParent: "CSI.btn", row: "3", }, ],
            [ "CaseCSIC.htm", { label: "CSIC", target: "_self", parentId: "CSIC", rowTwoParent: "CSI.btn", row: "3", }, ],
            [ "CaseCSID.htm", { label: "CSID", target: "_self", parentId: "CSID", rowTwoParent: "CSI.btn", row: "3", }, ],

            [ "CaseNotices.htm", { label: "Notices", target: "_self", parentId: "Case Notices", rowTwoParent: "Notices.btn", row: "3", }, ],
            [ "CaseSpecialLetter.htm", { label: "Special Letter", target: "_self", parentId: "Case Special Letter", rowTwoParent: "Notices.btn", row: "3", }, ],
            [ "CaseMemo.htm", { label: "Memo", target: "_self", parentId: "Case Memo", rowTwoParent: "Notices.btn", row: "3", }, ],

            [ "FinancialBilling.htm", { label: "Billing", target: "_self", parentId: "Billing", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "FinancialBillingApproval.htm", { label: "Billing Approval", target: "_self", parentId: "Billing Approval", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "BillsList.htm", { label: "Bills List", target: "_self", parentId: "Bills List", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "ElectronicBills.htm", { label: "eBills", target: "_self", parentId: "Electronic Bills", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "CasePaymentHistory.htm", { label: "Payment History", target: "_self", parentId: "Case Payment History", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "FinancialAbsentDayHolidayTracking.htm", { label: "Absent Days", target: "_self", parentId: "Tracking Absent Day Holiday", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "FinancialBillingRegistrationFeeTracking.htm", { label: "Registration Fee Tracking", target: "_self", parentId: "Tracking Registration Fee", rowTwoParent: "Billing.btn", row: "3", }, ],
            [ "FinancialManualPayment.htm", { label: "Manual Payments", target: "_self", parentId: "Manual Payments", rowTwoParent: "Billing.btn", row: "3", }, ],

            [ "ProviderOverview.htm", { label: "Overview", target: "_self", parentId: "Provider Overview", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderNotes.htm", { label: "Notes", target: "_self", parentId: "Provider Notes", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderInformation.htm", { label: "Info", target: "_self", parentId: "Provider Information", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderAddress.htm", { label: "Address", target: "_self", parentId: "Provider Address", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderParentAware.htm", { label: "Parent Aware", target: "_self", parentId: "Parent Aware", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderAccreditation.htm", { label: "Accred.", target: "_self", parentId: "Accreditation", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderTraining.htm", { label: "Training", target: "_self", parentId: "Training", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderRates.htm", { label: "Rates", target: "_self", parentId: "Rates", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderLicense.htm", { label: "License", target: "_self", parentId: "License", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderAlias.htm", { label: "Alias", target: "_self", parentId: "Provider Alias", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderBackgroundStudy.htm", { label: "Background", target: "_self", parentId: "Background Study", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderFeesAndAccounts.htm", { label: "Acct.", target: "_self", parentId: "Fees Accounts", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderRegistrationAndRenewal.htm", { label: "Registration", target: "_self", parentId: "Registration Renewal", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderTaxInfo.htm", { label: "Tax", target: "_self", parentId: "Tax Info", rowTwoParent: "Provider_Info.btn", row: "3", }, ],
            [ "ProviderPaymentHistory.htm", { label: "Payments", target: "_self", parentId: "Provider Payment History", rowTwoParent: "Provider_Info.btn", row: "3", }, ],

            [ "ProviderNotices.htm", { label: "Notices", target: "_self", parentId: "Provider Notices", rowTwoParent: "Provider_Notices.btn", row: "3", }, ],
            [ "ProviderSpecialLetter.htm", { label: "Special Letter", target: "_self", parentId: "Provider Special Letter", rowTwoParent: "Provider_Notices.btn", row: "3", }, ],
            [ "ProviderMemo.htm", { label: "Memo", target: "_self", parentId: "Provider Memo", rowTwoParent: "Provider_Notices.btn", row: "3", }, ],

            [ "ProviderProUserAccess.htm", { label: "User Access", target: "_self", parentId: "PRO User Access", rowTwoParent: "Pro.btn", row: "3", }, ],
            [ "ProUserDetail.htm", { label: "User Detail", target: "_self", parentId: "Pro User Details", rowTwoParent: "Pro.btn", row: "3", }, ],
            [ "ProUserSearch.htm", { label: "User Search", target: "_self", parentId: "Pro User Search", rowTwoParent: "Pro.btn", row: "3", }, ],
            [ "ProUserProviderRelationship.htm", { label: "Provider Relationship", target: "_self", parentId: "Pro User Provider Relationships", rowTwoParent: "Pro.btn", row: "3", }, ],
            [ "ProUserResetPassword.htm", { label: "Reset Password", target: "_self", parentId: "Pro User Reset Password", rowTwoParent: "Pro.btn", row: "3", }, ],

            [ "CaseTransfer.htm", { label: "Case Transfer", target: "_self", parentId: "Case Transfer", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "ServicingAgencyIncomingTransfers.htm", { label: "Incoming", target: "_blank", parentId: "Incoming Transfers", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "ServicingAgencyOutgoingTransfers.htm", { label: "Outgoing", target: "_blank", parentId: "Outgoing Transfers", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "FinancialClaimTransfer.htm", { label: "Claim Transfer", target: "_blank", parentId: "Claim Transfer", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "ProviderTransfer.htm", { label: "Provider Transfer", target: "_self", parentId: "Provider Transfer", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "TransferWorkloadCase.htm", { label: "Case Workload", target: "_self", parentId: "Transfer Caseload", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "TransferWorkloadClaim.htm", { label: "Claim Workload", target: "_self", parentId: "Transfer Claim Workload", rowTwoParent: "Transfer.btn", row: "3", }, ],
            [ "ProviderWorkloadTransfer.htm", { label: "Provider Workload", target: "_self", parentId: "Transfer Provider Workload", rowTwoParent: "Transfer.btn", row: "3", }, ],

            [ "FinancialClaimEstablishment.htm", { label: "Establishment", target: "_blank", parentId: "Claim Establishment", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimMaintenanceAmountDetails.htm", { label: "Details", target: "_self", parentId: "Maintenance Details", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimMaintenanceSummary.htm", { label: "Summary", target: "_self", parentId: "Maintenance Summary", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimNoticeOverpaymentText.htm", { label: "Overpayment Text", target: "_self", parentId: "Overpayment Text", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimNotes.htm", { label: "Notes", target: "_self", parentId: "Claim Notes", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimNotices.htm", { label: "Notices", target: "_self", parentId: "Claim Notices History", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "ProviderFraud.htm", { label: "Provider Fraud", target: "_self", parentId: "Provider Fraud", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimMaintenanceCase.htm", { label: "Maint-Case", target: "_self", parentId: "Maintenance Case", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimMaintenancePerson.htm", { label: "Maint-Person", target: "_self", parentId: "Maintenance Person", rowTwoParent: "Claims.btn", row: "3", }, ],
            [ "FinancialClaimMaintenanceProvider.htm", { label: "Maint-Provider", target: "_self", parentId: "Maintenance Provider", rowTwoParent: "Claims.btn", row: "3", }, ],
        ]),
        listPageList: [ "Alerts.htm", "ActiveCaseList.htm", "ClientSearch.htm", "InactiveCaseList.htm", "PendingCaseList.htm", "ProviderRegistrationList.htm", "ProviderSearch.htm", "ServicingAgencyIncomingTransfers.htm", "ServicingAgencyOutgoingTransfers.htm", "BillsList.htm", ],
        setWorkerRole() {
            switch (workerRole) {
                case "mec2functionsFinancialWorker":
                    this.rowMap.set( "rowTwo", [ "Member.btn", "Case.btn", "Activity_and_Income.btn", "Eligibility.btn", "SA.btn", "Notices.btn", "CSI.btn", "Provider_Info.btn", "Provider_Notices.btn", "Pro.btn", "Billing.btn", "Transfer.btn", "Claims.btn", ] )
                    break
                case "mec2functionsPaymentWorker":
                    this.rowMap.set( "rowTwo", [ "Billing.btn", "Provider_Info.btn", "Provider_Notices.btn", "Pro.btn", "Member.btn", "Case.btn", "Activity_and_Income.btn", "Eligibility.btn", "SA.btn", "Notices.btn", "CSI.btn", "Transfer.btn", "Claims.btn", ] )
                    break
                case "mec2functionsProviderWorker":
                    this.rowMap.set( "rowTwo", [ "Provider_Info.btn", "Provider_Notices.btn", "Pro.btn", "Billing.btn", "Member.btn", "Case.btn", "Activity_and_Income.btn", "Eligibility.btn", "SA.btn", "Notices.btn", "CSI.btn", "Transfer.btn", "Claims.btn", ] )
                    break
            };
        },
    };
    if (iFramed) { return }
    navMaps.setWorkerRole()
    try {
        let buttonDivOne = document.getElementById('buttonPanelOne'), buttonDivTwo = document.getElementById('buttonPanelTwo'), buttonDivThree = document.getElementById('buttonPanelThree'), buttonDivOneNTF = document.getElementById("buttonPanelOneNTF");
        !function createNavButtons() {
            navMaps.rowMap.forEach(function(valueArray, row) {
                if (row === "rowOne") {
                    buttonDivOne.insertAdjacentHTML( 'afterbegin', valueArray.map(page => '<button id="' + page + '" class="cButton nav">' + navMaps.allPagesMap.get(page).label + '</button>').join('') )
                } else if (row === "rowTwo") {
                    buttonDivTwo.insertAdjacentHTML( 'afterbegin', valueArray.map(label => '<button id="' + label + '" class="cButton nav">' + label.replaceAll(/_/g,' ').split(".")[0] + '</button>').join('') )
                }
            })
        }();
        //
        !function highlightNavOnPageLoad() {
            let thisPageNameMap = navMaps.allPagesMap.get(thisPageNameHtm)
            if (!thisPageNameMap) { return }
            if ( thisPageNameMap.row === "1" ) {
                document.getElementById(thisPageNameHtm).classList.add('open-page')
            } else if ( thisPageNameMap.row === "3" ) {
                populateNavRowThree(thisPageNameMap.rowTwoParent)
                document.getElementById(thisPageNameMap.rowTwoParent).classList.add('open-page')
            }
        }();
        //
        function populateNavRowThree(rowTwoCategory) {
            buttonDivThree.innerHTML = navMaps.rowPagesMap.get(rowTwoCategory).map(mapPageName => {
                let classList = "cButton nav"
                if (thisPageNameHtm === mapPageName) { classList += " open-page" }
                if (rowTwoCategory === "Eligibility.btn" && !reviewingEligibility && !["CaseEligibilityResultSelection.htm", "CaseCreateEligibilityResults.htm", ].includes(mapPageName) ) { classList += " hidden" }
                return '<button class="' + classList + '" id="' + mapPageName + '">' + navMaps.allPagesMap.get(mapPageName).label + '</button>'
            }).join('')
        }
        //
        function openNav(allPagesMapKey, target) {
            let destinationIsListPage = navMaps.listPageList.includes(allPagesMapKey)
            let qMarkParameters = ""
            let isListPage = navMaps.listPageList.includes(thisPageNameHtm)
            if (!destinationIsListPage && isListPage) {
                qMarkParameters = allPagesMapKey.indexOf("Provider") === 0 ? getListAndAlertTableParameters.provider() ?? '' : getListAndAlertTableParameters.case() ?? ''
                if (target === "_self") { document.body.style.opacity = ".8" }
                window.open('/ChildCare/' + allPagesMapKey + qMarkParameters, target)
                return
            }
            if (!editMode) {
                let targetPage = navMaps.allPagesMap.get(allPagesMapKey).parentId.replace(/ /g, '\ ')
                if (target === "_self") { document.body.style.opacity = ".8" }
                window.open( document.getElementById(targetPage).firstElementChild.href, target )
            } else if (editMode) {
                qMarkParameters = caseId ? "?parm2=" + caseId : ''
                window.open('/ChildCare/' + allPagesMapKey + qMarkParameters, "_blank")
            }
        }
        //
        function clickRowTwo(eventTarget) {
            buttonDivTwo.querySelectorAll('.cButton.nav.browsing').forEach(ele => ele.classList.remove('browsing'))
            populateNavRowThree(eventTarget.id)
            eventTarget.classList.add('browsing')
        }
        document.querySelector('.primary-navigation').addEventListener('click', (eventClick) => {
            let eventClickTarget = eventClick.target
            if ( eventClickTarget.parentElement === buttonDivOneNTF || eventClickTarget.nodeName !== "BUTTON") { return }
            if ( eventClickTarget.parentElement === buttonDivTwo ) {
                clickRowTwo(eventClickTarget)
                return
            }
            if (editMode) {
                openNav(eventClickTarget.id, "_blank")
                return
            }
            openNav(eventClickTarget.id, "_self")
        })
        document.querySelector('.primary-navigation').addEventListener('contextmenu', (eventContextMenu) => {
            let parentDiv = eventContextMenu.target.closest('div')
            if ( eventContextMenu.target.nodeName !== "BUTTON" ) { return }
            eventContextMenu.preventDefault();
            if ( parentDiv === buttonDivTwo ) {
                clickRowTwo(eventContextMenu.target)
                return
            }
            openNav(eventContextMenu.target.id, "_blank")
        })

        if ("getProviderOverview.htm".includes(thisPageNameHtm)) {
            let getProviderOverview = document.getElementById('Provider_Info.btn')
            getProviderOverview.click()
            getProviderOverview.classList.replace('browsing', 'open-page')
            document.getElementById('ProviderOverview.htm').classList.add('open-page')
        }
        if ("ProviderSearch.htm".includes(thisPageNameHtm)) { document.getElementById('Provider_Info.btn').click() };
        // SECTION_START New_Tab_Case_Number_Field
        !function newTabFieldButtons() {
            buttonDivOneNTF.insertAdjacentHTML('afterbegin', ''
                + '<div id="newTabInputDiv"><input id="newTabField" list="" autocomplete="off" class="form-control" placeholder="Case #" style="width: 10ch;"></input></div>'
                + '<button type="button" data-page-name="CaseNotes" id="FieldNotesNT" class="cButton nav">Notes</button>'
                + '<button type="button" data-page-name="CaseOverview" id="FieldOverviewNT" class="cButton nav">Overview</button>')
            newTabField = document.getElementById('newTabField')
            function clearNTF() { newTabField.value = '' }
            buttonDivOneNTF.addEventListener('click', function(clickEvent) {
                if (clickEvent.target.closest('button')?.nodeName === 'BUTTON' && (/\b\d{1,8}\b/).test(newTabField.value)) {
                    clickEvent.preventDefault()
                    openCaseNumber(clickEvent.target.dataset.pageName, newTabField.value)
                    clearNTF()
                }
            })
            newTabField.addEventListener('keydown', function(keydownEvent) {
                keydownEvent.stopImmediatePropagation()
                if (keydownEvent.target.value.length > 7) {
                    if (!['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'Home', 'End'].includes(keydownEvent.key) && ( !keydownEvent.ctrlKey && !['v', 'a', 'z'].includes(keydownEvent.key) ) ) {
                        keydownEvent.preventDefault()
                        return false
                    }
                }
                if ( !keydownEvent.ctrlKey && (/[a-z]/i).test(newTabField.value) ) { return }
                switch (keydownEvent.key) {
                    case 'n':
                        keydownEvent.preventDefault();
                        window.open('/ChildCare/CaseNotes.htm?parm2=' + newTabField.value, '_blank');
                        clearNTF()
                        break
                    case 'o':
                    case 'Enter':
                        keydownEvent.preventDefault();
                        window.open('/ChildCare/CaseOverview.htm?parm2=' + newTabField.value, '_blank');
                        clearNTF()
                        break
                }
            })
            function openCaseNumber(pageName, enteredCaseNumber) {
                if (pageName == "CaseNotes") { window.open('/ChildCare/CaseNotes.htm?parm2=' + enteredCaseNumber, '_blank') }
                else { window.open('/ChildCare/CaseOverview.htm?parm2=' + enteredCaseNumber, '_blank') }
            };
        }();
        editMode && (document.querySelectorAll('#buttonPanelTwo, #buttonPanelThree').forEach(ele => ele.classList.add('hidden') )); // SECTION_END New_Tab_Case_Number_Field
    } catch (error) { console.trace(error) }
}();
// ///////////////////////////// PRIMARY_NAVIGATION_BUTTONS SECTION_END \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ====================================================================================================
if (selectPeriod && countyInfo.userSettings.selectPeriodReversal && !editMode) { selectPeriodReversal() }
function selectPeriodReversal(selectPeriodEleToReverse = selectPeriod, startPos=0) {
    selectPeriodEleToReverse = sanitize.query(selectPeriodEleToReverse)
    if (!selectPeriodEleToReverse || selectPeriodEleToReverse.disabled) { return };
    selectPeriodEleToReverse.innerHTML = [...selectPeriodEleToReverse.children].reverse().map(ele => ele.outerHTML).join('')
};
!function nextPrevPeriodButtons() {
    if (iFramed) { return };
    if (!selectPeriod || !sanitize.query(selectPeriod) || !document.querySelector('#selectPeriod:not([disabled], [readonly], [type=hidden])')) { return }
    try {
        if (!editMode) {
            if (reviewingEligibility || thisPageNameHtm.indexOf("CaseApplicationInitiation.htm") > -1 || submitButton?.disabled) { return }
            let selectPeriodReversed = countyInfo.userSettings.selectPeriodReversal
            let lastAvailablePeriod = selectPeriod.children[0].value
            let prevPeriodButtons = '<span id="prevButtons"><button id="backGoSelect" tabindex="-1" type="button" data--next-or-prev="Prev" data--stay-or-go="Go" class="npp-button">«</button><button id="backSelect" tabindex="-1" type="button" data--next-or-prev="Prev" data--stay-or-go="Stay" class="npp-button">‹</button></span>',
                nextPeriodButtons = '<span id="nextButtons"><button id="forwardSelect" tabindex="-1" type="button" data--next-or-prev="Next" data--stay-or-go="Stay" class="npp-button">›</button><button id="forwardGoSelect" tabindex="-1" type="button" data--next-or-prev="Next" data--stay-or-go="Go" class="npp-button">»</button></span>'
            selectPeriod.insertAdjacentHTML('beforebegin', prevPeriodButtons)
            selectPeriod.insertAdjacentHTML('afterend', nextPeriodButtons)
            let nextButtons = document.getElementById('nextButtons')
            function checkPeriodMobility() {
                nextButtons.style.opacity = selectPeriod.value === lastAvailablePeriod ? ".5" : ""
            }
            checkPeriodMobility()

            selectPeriod.parentElement.addEventListener('click', function(clickEvent) {
                if (clickEvent.target.nodeName !== "BUTTON") { return; }
                checkPeriodMobility()
                let clickedButton = clickEvent.target.closest('button')
                selectNextPrev(clickedButton.id, clickedButton.dataset.NextOrPrev, clickedButton.dataset.StayOrGo)
            })
            function selectNextPrev(buttonId, nextOrPrev, stayOrGo) {
                if (nextOrPrev === "Next") {
                    if (selectPeriod.selectedIndex === 0) { // top of list
                        if (stayOrGo === "Go") { submitButton.click() }
                        return
                    }
                    selectPeriodReversed ? selectPeriod.selectedIndex-- : selectPeriod.selectedIndex++; //Subtracting goes up;
                    if (stayOrGo === "Go") { submitButton.click() }
                } else if (nextOrPrev === "Prev") {
                    selectPeriodReversed ? selectPeriod.selectedIndex++ : selectPeriod.selectedIndex--;
                    if (stayOrGo === "Go") { submitButton.click() }
                }
                checkPeriodMobility()
            };
        }
    } catch (error) { console.trace("nextPrevPeriodButtons", error) }
}();
docReady( document.body?.addEventListener('submit', function() { document.body.style.opacity = ".8" }) ); // Dim_Page_On_Submit
// docReady (document.querySelectorAll('input:read-write').forEach(function(ele) { ele.spellcheck = false }) )
!function footerLinks() {
    if (iFramed) { return }
    try {
        let foot = document.getElementById('footer_links');
        if (foot) {
            [...foot?.childNodes]?.filter(eleFeet => eleFeet.nodeType === 3 && eleFeet.length > 2).forEach(eleFoot => eleFoot.remove());
            let toes = document.getElementById('footer_links').children;
            [...toes]?.toSpliced(-1, 1).forEach((eleToes) => eleToes.insertAdjacentHTML('afterend', '<span class="footer">ı</span>'));
            const additionalFooterLinks = [
                ["https://owa.dhssir.cty.dhs.state.mn.us/owa/", "_blank", "SIR Mail"],
                ["https://owa.dhssir.cty.dhs.state.mn.us/csedforms/MMR/TSS_General_Request.asp", "_blank", "Help Desk"],
                ["https://www.dhs.state.mn.us/main/idcplg?IdcService=GET_DYNAMIC_CONVERSION&RevisionSelectionMethod=LatestReleased&dDocName=dhs16_146163", "_blank", "Resources"],
                ["https://policyquest.dhs.state.mn.us/", "_blank", "PolicyQuest"],
                ["https://www.mnworkforceone.com/", "_blank", "WF1"],
                ["https://owa.dhssir.cty.dhs.state.mn.us/csedforms/ccforms/TSS_PMI_Merge_Request.aspx", "_blank", "PMI Merge"],
                ["https://moms.mn.gov/", "_blank", "MOMS"],
                ["https://smi.dhs.state.mn.us/", "_blank", "SMI"],
            ]
            function getFooterLinks() {
                let footerLinks = ""
                let separatorSpan = '<span class="footer">ı</span>'
                for (let link in additionalFooterLinks) {
                    let linkArray = additionalFooterLinks[link]
                    footerLinks += separatorSpan + '<a href="' + linkArray[0] + '" target="' + linkArray[1] + '">' + linkArray[2] + '</a>'
                }
                return footerLinks
            }
            document.querySelector('#contactInformation').textContent = "Help Info"
            document.querySelector('#footer_links > a[href="https://bi.dhs.state.mn.us/BOE/BI"]').textContent = 'BOBI'
            let newUserManual = document.querySelector('#footer_links>a[href="https://www.dhs.state.mn.us/main/idcplg?IdcService=GET_DYNAMIC_CONVERSION&RevisionSelectionMethod=LatestReleased&dDocName=mecc-0002"]')
            newUserManual.outerHTML = '<a href="https://www.dhs.state.mn.us/main/idcplg?IdcService=GET_DYNAMIC_CONVERSION&RevisionSelectionMethod=LatestReleased&dDocName=MECC-0001" target="_blank" tabindex="-1">"New" User Manual</a><span class="footer">ı</span><a href="https://www.dhs.state.mn.us/main/idcplg?IdcService=GET_DYNAMIC_CONVERSION&RevisionSelectionMethod=LatestReleased&dDocName=dhs16_139409" target="_blank">User Manual</a>'
            document.getElementById('contactInformation').insertAdjacentHTML('afterend', getFooterLinks())
        }
    } catch (error) { console.trace(error) }
}();
// ====================================================================================================
// ///////// SECTION_END CUSTOM_NAVIGATION  (THE MEC2NAVIGATION SCRIPT SHOULD MIMIC THE ABOVE) \\\\\\\\
// ====================================================================================================
