// ==UserScript==
// @name         mec2navigation
// @namespace    http://github.com/MECH2-at-Github
// @description  Add functionality to MEC2 to improve navigation
// @author       MECH2
// @match        mec2.childcare.dhs.state.mn.us/*
// @version      0.1.2
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

'use strict';
// ====================================================================================================
// /////////////////////////////////// CUSTOM_NAVIGATION SECTION START \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ====================================================================================================
function isDeveloperModeEnabled() {
    let devModeWarning = localStorage.getItem('MECH2.devModeWarning')
    if (!devModeWarning) {
        document.querySelector('div.container:has(form)')?.insertAdjacentHTML('afterbegin', `
        <div id="devModeWarningBox" class="error_alertbox_new">
            <strong class="rederrortext">Notice: <a style="text-decoration: underline;" href="https://www.tampermonkey.net/changelog.php?show=dhdg" target="_blank">Tampermonkey</a> now requires "Developer Mode" enabled in Chrome. ⋮ › Extension › Manage Extensions (upper right corner).</strong>
            <span style="float: right !important; cursor: pointer;" id="devModeWarningClose">✖</span>
        </div>`)
        document.getElementById('devModeWarningClose').addEventListener('click', function() {
            localStorage.setItem('MECH2.devModeWarning', true)
            document.getElementById('devModeWarningBox').remove()
        })
    }
}
isDeveloperModeEnabled()
console.time('MEC2Functions')
document.getElementById('help')?.insertAdjacentHTML('afterend', '<a href="/ChildCare/PrivacyAndSystemSecurity.htm?from=mec2functions" target="_blank" style="margin-left: 10px;">' + GM_info.script.name + ' v' + GM_info.script.version + '</a>')
let pageWrap = document.querySelector('#page-wrap')
let notEditMode = document.querySelectorAll('#page-wrap').length;
let iFramed = window.location !== window.parent.location ? 1 : 0
let greenline = document.querySelector(".line_mn_green")
let focusEle = "blank"
let caseId = document.getElementById('caseId')?.value ?? undefined
let providerId = caseId ?? document.getElementById('providerId')?.value
let caseIdORproviderId = caseId ?? providerId
greenline.id = "greenline"
greenline.closest('.container')?.insertAdjacentHTML('afterend', `
<nav class="primary-navigation container">
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
    <div id="secondaryActionArea" class="button-container flex-horizontal db-container"></div>
</nav>
`)
try {
    if (notEditMode) {
        document.querySelector('.primary-navigation')?.insertAdjacentElement('beforebegin', pageWrap);
        pageWrap?.classList.add('container')
    }
}
catch (error) { console.trace(error) }
finally { document.documentElement.style.setProperty('--mainPanelMovedDown', '0') }
let buttonDivOne = document.getElementById('buttonPanelOne');
let buttonDivTwo = document.getElementById('buttonPanelTwo');
let buttonDivThree = document.getElementById('buttonPanelThree');
let searchIcon = "<span style='font-size: 80%'>🔍</span>"
let thisPageName = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1, window.location.pathname.lastIndexOf("."))
let thisPageNameHtm = thisPageName + ".htm"
let slashThisPageNameHtm = "/" + thisPageNameHtm
if (("Welcome.htm").includes(thisPageNameHtm)) { location.assign("Alerts.htm") } //auto-redirect from Welcome to Alerts
let reviewingEligibility = (thisPageNameHtm.indexOf("CaseEligibilityResult") > -1 && thisPageNameHtm.indexOf("CaseEligibilityResultSelection.htm") < 0)
document.querySelectorAll('tbody').forEach((e) => {
    e.addEventListener('click', (event) => {
        if (event.target.closest('tr') && !event.target.closest('tr').classList.contains('selected') ) {
            e.querySelector('.selected')?.classList.remove('selected')
            event.target.closest('tr')?.classList.add('selected')
        }
    })
}) //Fix for table entries losing selected class when clicked on. There is no way to know if a table shouldn't get the .selected class, so it does it for all.
$("h4").click((e) => $(e.target).nextAll().toggleClass("hidden")) //Make all h4 clicky hidden

function fGetCaseParameters() { // Parameters for navigating from Alerts or Lists, and the column
    const caseTableMap = new Map([
        ["Alerts.htm", [document.querySelector("table#caseOrProviderAlertsTable > tbody"), 3] ],
        ["ClientSearch.htm", [document.querySelector('table#clientSearchProgramResults > tbody'), 1] ],
    ])
    let caseTableFromMap = caseTableMap.get(thisPageNameHtm) ?? [document.querySelector('table > tbody'), 1]
    let parameter2alerts = caseTableFromMap[0].querySelector('tr > td:nth-of-type(2)') === null ? undefined : '?parm2=' + caseTableFromMap[0].querySelector('tr.selected > td:nth-of-type(' + caseTableFromMap[1] + ') > a')?.textContent
    if (parameter2alerts === undefined) { return }
    let parameter3alerts = document.getElementById('periodBeginDate')?.value === undefined ? '' : '&parm3=' + document.getElementById('periodBeginDate')?.value.replace(/\//g, '') + document.getElementById('periodEndDate')?.value.replace(/\//g, '')
    return parameter2alerts + parameter3alerts
}
function fGetProviderParameters() {
    const providerTableMap = new Map([
        ["Alerts.htm", [document.querySelector("table#caseOrProviderAlertsTable > tbody"), 3] ],
        ["ProviderRegistrationList.htm", [document.querySelector('table#providerRegistrationTable > tbody'), 2] ],
        ["ProviderSearch.htm", [document.querySelector('table#providerSearchTable > tbody'), 1] ],
    ])
    let providerTableFromMap = providerTableMap.get(thisPageNameHtm) ?? undefined
    let parameter2alerts = providerTableFromMap[0].querySelector('tr > td:nth-of-type(2)') === null ? '' : '?providerId=' + providerTableFromMap[0].querySelector('tr.selected > td:nth-of-type(' + providerTableFromMap[1] + ')')?.textContent
    return parameter2alerts
}
// ================================================================================================
// ////////////////////////////// NAVIGATION_BUTTONS SECTION_START \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ================================================================================================

// ====================================================================================================
// ///////////////////////////// PRIMARY_NAVIGATION_BUTTONS SECTION_START \\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ====================================================================================================

if (!iFramed) {
    try {
        // SECTION_START Declaring_navigation_button_arrays
    // const objectToMap = obj => { // https://www.tutorialspoint.com/convert-object-to-a-map-javascript
    //    const keys = Object.keys(obj);
    //    const map = new Map();
    //    for(let i = 0; i < keys.length; i++){
    //       //inserting new key value pair inside map
    //       map.set(keys[i], obj[keys[i]]);
    //    };
    //    return map;
    // };
        const oRowOneButtons = { //Goto Buttons, objectGroupName: { buttonText: "Name as it appears on a button", gotoPage: "gotoPageName", opensIn: "_self or _blank", parentId: "Id of parent", buttonId: "Id of Button'],
            alerts: { buttonText: "Alerts", gotoPage: "Alerts", opensIn: "_self", parentId: "Alerts", buttonId: "AlertsSelf" },
            alertsPlus: { buttonText: "+", gotoPage: "Alerts", opensIn: "_blank", parentId: "Alerts", buttonId: "AlertsBlank" },
            notes: { buttonText: "Notes", gotoPage: "CaseNotes", opensIn: "_self", parentId: "Case Notes", buttonId: "CaseNotesSelf" },
            notesPlus: { buttonText: "+", gotoPage: "CaseNotes", opensIn: "_blank", parentId: "Case Notes", buttonId: "CaseNotesBlank" },
            overview: { buttonText: "Overview", gotoPage: "CaseOverview", opensIn: "_self", parentId: "Case Overview", buttonId: "CaseOverviewSelf" },
            overviewPlus: { buttonText: "+", gotoPage: "CaseOverview", opensIn: "_blank", parentId: "Case Overview", buttonId: "CaseOverviewBlank" },
            summary: { buttonText: "Summary", gotoPage: "CasePageSummary", opensIn: "_self", parentId: "Page Summary", buttonId: "CasePageSummarySelf" },
            clientSearch: { buttonText: "Client " + searchIcon, gotoPage: "ClientSearch", opensIn: "_self", parentId: "Client Search", buttonId: "ClientSearchSelf" },
            clientSearchPlus: { buttonText: "+", gotoPage: "ClientSearch", opensIn: "_blank", parentId: "Client Search", buttonId: "ClientSearchBlank" },
            providerSearch: { buttonText: "Provider " + searchIcon, gotoPage: "ProviderSearch", opensIn: "_self", parentId: "Provider Search", buttonId: "ProviderSearchSelf" },
            providerSearchPlus: { buttonText: "+", gotoPage: "ProviderSearch", opensIn: "_blank", parentId: "Provider Search", buttonId: "ProviderSearchBlank" },
            activeCaseList: { buttonText: "Active", gotoPage: "ActiveCaseList", opensIn: "_self", parentId: "Active Caseload List", buttonId: "ActiveCaseListSelf" },
            activeCaseListPlus: { buttonText: "+", gotoPage: "ActiveCaseList", opensIn: "_blank", parentId: "Active Caseload List", buttonId: "ActiveCaseListBlank" },
            pendingCaseList: { buttonText: "Pending", gotoPage: "PendingCaseList", opensIn: "_self", parentId: "Pending Case List", buttonId: "PendingCaseListSelf" },
            pendingCaseListPlus: { buttonText: "+", gotoPage: "PendingCaseList", opensIn: "_blank", parentId: "Pending Case List", buttonId: "PendingCaseListBlank" },
            inactiveCaseList: { buttonText: "Inactive", gotoPage: "InactiveCaseList", opensIn: "_self", parentId: "Inactive Case List", buttonId: "InactiveCaseListSelf" },
            inactiveCaseListPlus: { buttonText: "+", gotoPage: "InactiveCaseList", opensIn: "_blank", parentId: "Inactive Case List", buttonId: "InactiveCaseListBlank" },
            newApplication: { buttonText: "New App", gotoPage: "CaseApplicationInitiation", opensIn: "_self", parentId: "Case Application Initiation", buttonId: "NewAppSelf" },
            newApplicationPlus: { buttonText: "+", gotoPage: "CaseApplicationInitiation", opensIn: "_blank", parentId: "Case Application Initiation", buttonId: "NewAppBlank" },
        };
        const oRowTwoButtons = { //   Main Row (2nd row, categories) buttons, { buttonText: "Name as it appears on a button", buttonId: "oRowTwoButtonsId" },
            member: { buttonText: "Member", buttonId: "memberMainButtons" },
            case: { buttonText: "Case", buttonId: "caseButtons" },
            activityIncome: { buttonText: "Activity and Income", buttonId: "activityIncomeButtons" },
            eligibility: { buttonText: "Eligibility", buttonId: "eligibilityButtons" },
            sa: { buttonText: "SA", buttonId: "saButtons" },
            notices: { buttonText: "Notices", buttonId: "noticesButtons" },
            providerInfo: { buttonText: "Provider Info", buttonId: "providerButtons" },
            providerNotices: { buttonText: "Provider Notices", buttonId: "providerNoticesButtons" },
            billing: { buttonText: "Billing", buttonId: "billingButtons" },
            csi: { buttonText: "CSI", buttonId: "csiButtons" },
            transfer: { buttonText: "Transfer", buttonId: "transferButtons" },
            claims: { buttonText: "Claims", buttonId: "claimsButtons" },
        };

        const oRowThreeButtons = {
            memberMainButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                caseMemberi: { buttonName: "Member I", pageWithoutDotHtm: "CaseMember", opensIn: "_self", parentId: "Member", buttonId: "CaseMemberSelf", rowTwoParent: "memberMainButtons" },
                caseMemberii: { buttonName: "Member II", pageWithoutDotHtm: "CaseMemberII", opensIn: "_self", parentId: "Member II", buttonId: "CaseMemberIISelf", rowTwoParent: "memberMainButtons" },
                caseParent: { buttonName: "Parent", pageWithoutDotHtm: "CaseParent", opensIn: "_self", parentId: "Parent", buttonId: "CaseParentSelf", rowTwoParent: "memberMainButtons" },
                caseCse: { buttonName: "CSE", pageWithoutDotHtm: "CaseCSE", opensIn: "_self", parentId: "Child Support Enforcement", buttonId: "CaseCSESelf", rowTwoParent: "memberMainButtons" },
                caseSchool: { buttonName: "School", pageWithoutDotHtm: "CaseSchool", opensIn: "_self", parentId: "School", buttonId: "CaseSchoolSelf", rowTwoParent: "memberMainButtons" },
                caseProvider: { buttonName: "Provider", pageWithoutDotHtm: "CaseChildProvider", opensIn: "_self", parentId: "Child Provider", buttonId: "CaseChildProviderSelf", rowTwoParent: "memberMainButtons" },
                caseSpecialNeeds: { buttonName: "Special Needs", pageWithoutDotHtm: "CaseSpecialNeeds", opensIn: "_self", parentId: "Special Needs", buttonId: "CaseSpecialNeedsSelf", rowTwoParent: "memberMainButtons" },
                caseDisability: { buttonName: "Disability", pageWithoutDotHtm: "CaseDisability", opensIn: "_self", parentId: "Disability", buttonId: "CaseDisabilitySelf", rowTwoParent: "memberMainButtons" },
                caseFraud: { buttonName: "Fraud", pageWithoutDotHtm: "CaseFraud", opensIn: "_self", parentId: "Case Fraud", buttonId: "CaseFraudSelf", rowTwoParent: "memberMainButtons" },
                caseImmigration: { buttonName: "Immigration", pageWithoutDotHtm: "CaseImmigration", opensIn: "_self", parentId: "Immigration", buttonId: "CaseImmigrationSelf", rowTwoParent: "memberMainButtons" },
                caseAlias: { buttonName: "Alias", pageWithoutDotHtm: "CaseAlias", opensIn: "_self", parentId: "Case Alias", buttonId: "CaseAliasSelf", rowTwoParent: "memberMainButtons" },
                caseRemoveMember: { buttonName: "Remove", pageWithoutDotHtm: "CaseRemoveMember", opensIn: "_self", parentId: "Remove a Member", buttonId: "CaseRemoveMemberSelf", rowTwoParent: "memberMainButtons" },
                caseMemberHistory: { buttonName: "History", pageWithoutDotHtm: "CaseMemberHistory", opensIn: "_self", parentId: "Member History", buttonId: "CaseMemberHistorySelf", rowTwoParent: "memberMainButtons" },
                caseMemberHistoryPlus: { buttonName: "+", pageWithoutDotHtm: "CaseMemberHistory", opensIn: "_blank", parentId: "Member History", buttonId: "CaseMemberHistoryBlank", rowTwoParent: "memberMainButtons" },
            },
            activityIncomeButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                caseEarnedIncome: { buttonName: "Earned", pageWithoutDotHtm: "CaseEarnedIncome", opensIn: "_self", parentId: "Earned Income", buttonId: "CaseEarnedIncomeSelf", rowTwoParent: "activityIncomeButtons" },
                caseUnearnedIncome: { buttonName: "Unearned", pageWithoutDotHtm: "CaseUnearnedIncome", opensIn: "_self", parentId: "Unearned Income", buttonId: "CaseUnearnedIncomeSelf", rowTwoParent: "activityIncomeButtons" },
                caseLumpSumIncome: { buttonName: "Lump Sum", pageWithoutDotHtm: "CaseLumpSum", opensIn: "_self", parentId: "Lump Sum", buttonId: "CaseLumpSumSelf", rowTwoParent: "activityIncomeButtons" },
                caseExpensesIncome: { buttonName: "Expenses", pageWithoutDotHtm: "CaseExpense", opensIn: "_self", parentId: "Expenses", buttonId: "CaseExpensesSelf", rowTwoParent: "activityIncomeButtons" },
                caseEducationActivity: { buttonName: "Education", pageWithoutDotHtm: "CaseEducationActivity", opensIn: "_self", parentId: "Education Activity", buttonId: "CaseEducationActivitySelf", rowTwoParent: "activityIncomeButtons" },
                caseEmploymentActivity: { buttonName: "Employment", pageWithoutDotHtm: "CaseEmploymentActivity", opensIn: "_self", parentId: "Employment Activity", buttonId: "CaseEmploymentActivitySelf", rowTwoParent: "activityIncomeButtons" },
                caseSupportActivity: { buttonName: "Support", pageWithoutDotHtm: "CaseSupportActivity", opensIn: "_self", parentId: "Support Activity", buttonId: "CaseSupportActivitySelf", rowTwoParent: "activityIncomeButtons" },
                caseJobSearchTracking: { buttonName: "Job Search", pageWithoutDotHtm: "CaseJobSearchTracking", opensIn: "_self", parentId: "Job Search Tracking", buttonId: "CaseJobSearchTrackingSelf", rowTwoParent: "activityIncomeButtons" },
            },
            caseButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                editSummary: { buttonName: "Edit Summary", pageWithoutDotHtm: "CaseEditSummary", opensIn: "_self", parentId: "Edit Summary", buttonId: "CaseEditSummarySelf", rowTwoParent: "caseButtons" },
                caseAddress: { buttonName: "Address", pageWithoutDotHtm: "CaseAddress", opensIn: "_self", parentId: "Case Address", buttonId: "CaseAddressSelf", rowTwoParent: "caseButtons" },
                caseAction: { buttonName: "Case Action", pageWithoutDotHtm: "CaseAction", opensIn: "_self", parentId: "Case Action", buttonId: "CaseActionSelf", rowTwoParent: "caseButtons" },
                caseFunding: { buttonName: "Funding Availability", pageWithoutDotHtm: "FundingAvailability", opensIn: "_self", parentId: "Funding Availability", buttonId: "FundingAvailabilitySelf", rowTwoParent: "caseButtons" },
                caseRedetermination: { buttonName: "Redetermination", pageWithoutDotHtm: "CaseRedetermination", opensIn: "_self", parentId: "Case Redetermination", buttonId: "CaseRedeterminationSelf", rowTwoParent: "caseButtons" },
                caseAppInfo: { buttonName: "Application Info", pageWithoutDotHtm: "ApplicationInformation", opensIn: "_self", parentId: "Case Application Info", buttonId: "CaseApplicationInfoSelf", rowTwoParent: "caseButtons" },
                caseReinstate: { buttonName: "Reinstate", pageWithoutDotHtm: "CaseReinstate", opensIn: "_self", parentId: "Reinstate", buttonId: "CaseReinstateSelf", rowTwoParent: "caseButtons" },
            },
            eligibilityButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                eligibilitySelection: { buttonName: "Selection", pageWithoutDotHtm: "CaseEligibilityResultSelection", opensIn: "_self", parentId: "Eligibility Results Selection", buttonId: "CaseEligibilityResultSelectionSelf", rowTwoParent: "eligibilityButtons" },
                eligibilityOverview: { buttonName: "Overview", pageWithoutDotHtm: "CaseEligibilityResultOverview", opensIn: "_self", parentId: "Results Overview", buttonId: "CaseEligibilityResultOverviewSelf", rowTwoParent: "eligibilityButtons" },
                eligibilityFamily: { buttonName: "Family", pageWithoutDotHtm: "CaseEligibilityResultFamily", opensIn: "_self", parentId: "Family Results", buttonId: "CaseEligibilityResultFamilySelf", rowTwoParent: "eligibilityButtons" },
                eligibilityPerson: { buttonName: "Person", pageWithoutDotHtm: "CaseEligibilityResultPerson", opensIn: "_self", parentId: "Person Results", buttonId: "CaseEligibilityResultPersonSelf", rowTwoParent: "eligibilityButtons" },
                eligibilityActivity: { buttonName: "Activity", pageWithoutDotHtm: "CaseEligibilityResultActivity", opensIn: "_self", parentId: "Activity Results", buttonId: "CaseEligibilityResultActivitySelf", rowTwoParent: "eligibilityButtons" },
                eligibilityFinancial: { buttonName: "Financial", pageWithoutDotHtm: "CaseEligibilityResultFinancial", opensIn: "_self", parentId: "Financial Results", buttonId: "CaseEligibilityResultFinancialSelf", rowTwoParent: "eligibilityButtons" },
                eligibilityApproval: { buttonName: "Approval", pageWithoutDotHtm: "CaseEligibilityResultApproval", opensIn: "_self", parentId: "Approval Results", buttonId: "CaseEligibilityResultApprovalSelf", rowTwoParent: "eligibilityButtons" },
                eligibilityCreateResults: { buttonName: "Create Eligibility Results", pageWithoutDotHtm: "CaseCreateEligibilityResults", opensIn: "_self", parentId: "Create Eligibility Results", buttonId: "CaseCreateEligibilityResultsSelf", rowTwoParent: "eligibilityButtons" },
            },
            saButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                saOverview: { buttonName: "Overview", pageWithoutDotHtm: "CaseServiceAuthorizationOverview", opensIn: "_self", parentId: "Service Authorization Overview", buttonId: "CaseServiceAuthorizationOverviewSelf", rowTwoParent: "saButtons" },
                saCopay: { buttonName: "Copay", pageWithoutDotHtm: "CaseCopayDistribution", opensIn: "_self", parentId: "Copay Distribution", buttonId: "CaseCopayDistributionSelf", rowTwoParent: "saButtons" },
                saApproval: { buttonName: "Approval", pageWithoutDotHtm: "CaseServiceAuthorizationApproval", opensIn: "_self", parentId: "Service Authorization Approval", buttonId: "CaseServiceAuthorizationApprovalSelf", rowTwoParent: "saButtons" },
                saCreateResults: { buttonName: "Create SA", pageWithoutDotHtm: "CaseCreateServiceAuthorizationResults", opensIn: "_self", parentId: "Create Service Authorization Results", buttonId: "CaseCreateServiceAuthorizationResultsSelf", rowTwoParent: "saButtons" },
            },
            csiButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                csiA: { buttonName: "CSIA", pageWithoutDotHtm: "CaseCSIA", opensIn: "_self", parentId: "CSIA", buttonId: "CSIAself", rowTwoParent: "csiButtons" },
                csiB: { buttonName: "CSIB", pageWithoutDotHtm: "CaseCSIB", opensIn: "_self", parentId: "CSIB", buttonId: "CSIBself", rowTwoParent: "csiButtons" },
                csiC: { buttonName: "CSIC", pageWithoutDotHtm: "CaseCSIC", opensIn: "_self", parentId: "CSIC", buttonId: "CSICself", rowTwoParent: "csiButtons" },
                csiD: { buttonName: "CSID", pageWithoutDotHtm: "CaseCSID", opensIn: "_self", parentId: "CSID", buttonId: "CSIDself", rowTwoParent: "csiButtons" },
            },
            noticesButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                caseNotices: { buttonName: "Notices", pageWithoutDotHtm: "CaseNotices", opensIn: "_self", parentId: "Case Notices", buttonId: "CaseNoticesSelf", rowTwoParent: "noticesButtons" },
                caseSpecialLetter: { buttonName: "Special Letter", pageWithoutDotHtm: "CaseSpecialLetter", opensIn: "_self", parentId: "Case Special Letter", buttonId: "CaseSpecialLetterSelf", rowTwoParent: "noticesButtons" },
                caseMemo: { buttonName: "Memo", pageWithoutDotHtm: "CaseMemo", opensIn: "_self", parentId: "Case Memo", buttonId: "CaseMemoSelf", rowTwoParent: "noticesButtons" },
            },
            billingButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                financialBilling: { buttonName: "Billing", pageWithoutDotHtm: "FinancialBilling", opensIn: "_self", parentId: "Billing", buttonId: "FinancialBillingSelf", rowTwoParent: "billingButtons" },
                financialBillingApproval: { buttonName: "Billing Approval", pageWithoutDotHtm: "FinancialBillingApproval", opensIn: "_self", parentId: "Billing Approval", buttonId: "FinancialBillingApprovalSelf", rowTwoParent: "billingButtons" },
                financialBillsList: { buttonName: "Bills List", pageWithoutDotHtm: "BillsList", opensIn: "_self", parentId: "Bills List", buttonId: "BillsListSelf", rowTwoParent: "billingButtons" },
                financialPayHistory: { buttonName: "Payment History", pageWithoutDotHtm: "CasePaymentHistory", opensIn: "_self", parentId: "Case Payment History", buttonId: "CasePaymentHistorySelf", rowTwoParent: "billingButtons" },
                financialAbsentDays: { buttonName: "Absent Days", pageWithoutDotHtm: "FinancialAbsentDayHolidayTracking", opensIn: "_self", parentId: "Tracking Absent Day Holiday", buttonId: "FinancialAbsentDayHolidayTrackingSelf", rowTwoParent: "billingButtons" },
                financialRegistrationFee: { buttonName: "Registration Fee Tracking", pageWithoutDotHtm: "FinancialBillingRegistrationFeeTracking", opensIn: "_self", parentId: "Tracking Registration Fee", buttonId: "FinancialBillingRegistrationFeeTrackingSelf", rowTwoParent: "billingButtons" },
                financialManualPayments: { buttonName: "Manual Payments", pageWithoutDotHtm: "FinancialManualPayment", opensIn: "_self", parentId: "Manual Payments", buttonId: "FinancialManualPaymentSelf", rowTwoParent: "billingButtons" },
            },
            providerButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                providerOverview: { buttonName: "Overview", pageWithoutDotHtm: "ProviderOverview", opensIn: "_self", parentId: "Provider Overview", buttonId: "ProviderOverviewSelf", rowTwoParent: "providerButtons" },
                providerNotes: { buttonName: "Notes", pageWithoutDotHtm: "ProviderNotes", opensIn: "_self", parentId: "Provider Notes", buttonId: "ProviderNotesSelf", rowTwoParent: "providerButtons" },
                providerInformation: { buttonName: "Info", pageWithoutDotHtm: "ProviderInformation", opensIn: "_self", parentId: "Provider Information", buttonId: "ProviderInformationSelf", rowTwoParent: "providerButtons" },
                providerAddress: { buttonName: "Address", pageWithoutDotHtm: "ProviderAddress", opensIn: "_self", parentId: "Provider Address", buttonId: "ProviderAddressSelf", rowTwoParent: "providerButtons" },
                providerParentAware: { buttonName: "Parent Aware", pageWithoutDotHtm: "ProviderParentAware", opensIn: "_self", parentId: "Parent Aware", buttonId: "ProviderParentAwareSelf", rowTwoParent: "providerButtons" },
                providerAccreditation: { buttonName: "Accred.", pageWithoutDotHtm: "ProviderAccreditation", opensIn: "_self", parentId: "Accreditation", buttonId: "ProviderAccreditationSelf", rowTwoParent: "providerButtons" },
                providerTraining: { buttonName: "Training", pageWithoutDotHtm: "ProviderTraining", opensIn: "_self", parentId: "Training", buttonId: "ProviderTrainingSelf", rowTwoParent: "providerButtons" },
                providerRates: { buttonName: "Rates", pageWithoutDotHtm: "ProviderRates", opensIn: "_self", parentId: "Rates", buttonId: "ProviderRatesSelf", rowTwoParent: "providerButtons" },
                providerLicense: { buttonName: "License", pageWithoutDotHtm: "ProviderLicense", opensIn: "_self", parentId: "License", buttonId: "ProviderLicenseSelf", rowTwoParent: "providerButtons" },
                providerAlias: { buttonName: "Alias", pageWithoutDotHtm: "ProviderAlias", opensIn: "_self", parentId: "Provider Alias", buttonId: "ProviderAliasSelf", rowTwoParent: "providerButtons" },
                providerBackground: { buttonName: "Background", pageWithoutDotHtm: "ProviderBackgroundStudy", opensIn: "_self", parentId: "Background Study", buttonId: "ProviderBackgroundStudySelf", rowTwoParent: "providerButtons" },
                providerFeesAndAccounts: { buttonName: "Accounts", pageWithoutDotHtm: "ProviderFeesAndAccounts", opensIn: "_self", parentId: "Fees Accounts", buttonId: "ProviderFeesAndAccounts", rowTwoParent: "providerButtons" },
                providerRegistrationAndRenewal: { buttonName: "Registration", pageWithoutDotHtm: "ProviderRegistrationAndRenewal", opensIn: "_self", parentId: "Registration Renewal", buttonId: "ProviderRegistrationSelf", rowTwoParent: "providerButtons" },
                providerTaxInfo: { buttonName: "Tax", pageWithoutDotHtm: "ProviderTaxInfo", opensIn: "_self", parentId: "Tax Info", buttonId: "ProviderTaxInfoSelf", rowTwoParent: "providerButtons" },
                providerPaymentHistory: { buttonName: "Payments", pageWithoutDotHtm: "ProviderPaymentHistory", opensIn: "_self", parentId: "Provider Payment History", buttonId: "ProviderPaymentHistory", rowTwoParent: "providerButtons" },
            },
            providerNoticesButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                providerNotices: { buttonName: "Notices", pageWithoutDotHtm: "ProviderNotices", opensIn: "_self", parentId: "Provider Notices", buttonId: "ProviderNoticesSelf", rowTwoParent: "providerNoticesButtons" },
                providerSpecialLetter: { buttonName: "Special Letter", pageWithoutDotHtm: "ProviderSpecialLetter", opensIn: "_self", parentId: "Provider Special Letter", buttonId: "ProviderSpecialLetterSelf", rowTwoParent: "providerNoticesButtons" },
                providerMemo: { buttonName: "Memo", pageWithoutDotHtm: "ProviderMemo", opensIn: "_self", parentId: "Provider Memo", buttonId: "ProviderMemoSelf", rowTwoParent: "providerNoticesButtons" },
            },
            transferButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                caseTransfer: { buttonName: "Case Transfer", pageWithoutDotHtm: "CaseTransfer", opensIn: "_self", parentId: "Case Transfer", buttonId: "CaseTransferSelf", rowTwoParent: "transferButtons" },
                incomingTransfer: { buttonName: "Incoming", pageWithoutDotHtm: "ServicingAgencyIncomingTransfers", opensIn: "_blank", parentId: "Incoming Transfers", buttonId: "ServicingAgencyIncomingTransfersSelf", rowTwoParent: "transferButtons" },
                outgoingTransfer: { buttonName: "Outgoing", pageWithoutDotHtm: "ServicingAgencyOutgoingTransfers", opensIn: "_blank", parentId: "Outgoing Transfers", buttonId: "ServicingAgencyOutgoingTransfersSelf", rowTwoParent: "transferButtons" },
                financialClaimTransfer: { buttonName: "Claim Transfer", pageWithoutDotHtm: "FinancialClaimTransfer", opensIn: "_blank", parentId: "Claim Transfer", buttonId: "FinancialClaimTransferSelf", rowTwoParent: "transferButtons" },
            },
            claimsButtons: {//objectName: { buttonName: "Button Name", pageWithoutDotHtm: "PageNameWithoutDotHtm", opensIn: "_self or _blank", parentId: "Id of Parent", buttonId: "Id of Button", rowTwoParent: "RowTwoParent"},
                claimEstablishment: { buttonName: "Establishment", pageWithoutDotHtm: "FinancialClaimEstablishment", opensIn: "_blank", parentId: "Claim Establishment", buttonId: "FinancialClaimEstablishmentBlank", rowTwoParent: "claimsButtons" },
                claimDetails: { buttonName: "Details", pageWithoutDotHtm: "FinancialClaimMaintenanceAmountDetails", opensIn: "_self", parentId: "Maintenance Details", buttonId: "FinancialClaimMaintenanceAmountDetailsSelf", rowTwoParent: "claimsButtons" },
                claimSummary: { buttonName: "Summary", pageWithoutDotHtm: "FinancialClaimMaintenanceSummary", opensIn: "_self", parentId: "Maintenance Summary", buttonId: "FinancialClaimMaintenanceSummarySelf", rowTwoParent: "claimsButtons" },
                claimOverpaymentText: { buttonName: "Overpayment Text", pageWithoutDotHtm: "FinancialClaimNoticeOverpaymentText", opensIn: "_self", parentId: "Overpayment Text", buttonId: "FinancialClaimNoticeOverpaymentTextSelf", rowTwoParent: "claimsButtons" },
                claimNotes: { buttonName: "Notes", pageWithoutDotHtm: "FinancialClaimNotes", opensIn: "_self", parentId: "Claim Notes", buttonId: "FinancialClaimNotesSelf", rowTwoParent: "claimsButtons" },
                claimNotices: { buttonName: "Notices", pageWithoutDotHtm: "FinancialClaimNotices", opensIn: "_self", parentId: "Claim Notices History", buttonId: "FinancialClaimNoticesSelf", rowTwoParent: "claimsButtons" },
                providerFraud: { buttonName: "Provider Fraud", pageWithoutDotHtm: "ProviderFraud", opensIn: "_self", parentId: "Provider Fraud", buttonId: "ProviderFraudSelf", rowTwoParent: "providerButtons"},
                claimMaintenanceCase: { buttonName: "Maint-Case", pageWithoutDotHtm: "FinancialClaimMaintenanceCase", opensIn: "_self", parentId: "Maintenance Case", buttonId: "FinancialClaimMaintenanceCaseSelf", rowTwoParent: "claimsButtons" },
                claimMaintenancePerson: { buttonName: "Maint-Person", pageWithoutDotHtm: "FinancialClaimMaintenancePerson", opensIn: "_self", parentId: "Maintenance Person", buttonId: "FinancialClaimMaintenancePersonSelf", rowTwoParent: "claimsButtons" },
                claimMaintenanceProvider: { buttonName: "Maint-Provider", pageWithoutDotHtm: "FinancialClaimMaintenanceProvider", opensIn: "_self", parentId: "Maintenance Provider", buttonId: "FinancialClaimMaintenanceProviderSelf", rowTwoParent: "claimsButtons" },
            }
        }

        function fRowOneButtonsString() {//row 2 buttons - Member, Case, Activity and Income...
            let vRowOneButtonsString = ""
            for (let page in oRowOneButtons) {
                let buttonProperties = {
                    text: oRowOneButtons[page].buttonText,
                    id: oRowOneButtons[page].buttonId,
                    pageName: oRowOneButtons[page].gotoPage,
                    howToOpen: notEditMode ? oRowOneButtons[page].opensIn : "_blank",
                    parentId: oRowOneButtons[page].parentId,
                    classes: oRowOneButtons[page].buttonText === "+" ? 'cButton cButton__nav cButton__nav__plus' : 'cButton cButton__nav',
                }
                let vButtonHtml = '<button type="button" tabindex="-1" class="' + buttonProperties.classes + '" id="' + buttonProperties.id + '" data-how-to-open="' + buttonProperties.howToOpen + '" data-page-name="' + buttonProperties.pageName + '" data-page-link-using-id="' + buttonProperties.parentId + '">' + buttonProperties.text + '</button>'
                vRowOneButtonsString += vButtonHtml
            }
            return vRowOneButtonsString
        }

        buttonDivOne.insertAdjacentHTML("beforeend", fRowOneButtonsString())
        buttonDivOne.addEventListener('click', function(event) {//sends the gotoButtons array value 4 to gotoPage
            if (event.target.closest('button')?.tagName?.toLowerCase() === 'button' && !(["FieldNotesNT", "FieldOverviewNT"]).includes(event.target.closest('button').id)) {
                gotoPage(event.target.closest('button').id)
            }
        })
        function fRow2ButtonsString() {//row 2 buttons - Member...
            let vRowTwoButtonsString = ""
            for (let group in oRowTwoButtons) {
                let vButtonHtml = '<button type="button" tabindex="-1" class="cButton cButton__nav" id="' + oRowTwoButtons[group].buttonId + '">' + oRowTwoButtons[group].buttonText + '</button>'
                vRowTwoButtonsString += vButtonHtml
            }
            return vRowTwoButtonsString
        }
        if (notEditMode) {
            buttonDivTwo.insertAdjacentHTML("beforeend", fRow2ButtonsString())
            buttonDivTwo.addEventListener('click', function(event) {// sends the oRowTwoButtons button ID
                if (notEditMode && event.target.tagName?.toLowerCase() === 'button') {
                    document.getElementById('buttonPanelThree').replaceChildren()
                    fRowThreeButtonsString(event.target.id)
                    highlightPageAndCategory()
                }
            })
        }

        function highlightPageAndCategory() { // Highlight_Row_2_3_Buttons
            if (notEditMode) {
                try {
                    let parentPage = findPageParent()
                    if (parentPage !== undefined) {
                        if (parentPage[0] !== "undefined") {
                            $('#' + oRowThreeButtons[parentPage[0]][parentPage[1]].rowTwoParent).add('#' + oRowThreeButtons[parentPage[0]][parentPage[1]].buttonId).addClass('cButton__nav__open-page')
                        } else if ([parentPage[1]] !== "undefined") {
                            $('#' + oRowOneButtons[parentPage[1]].buttonId).addClass('cButton__nav__open-page')
                        }
                    }
                }
                catch (error) { console.trace("highlightPageAndCategory", error) }
                finally {
                    if ($('#eligibilityButtons.cButton__nav__open-page, #eligibilityButtons.cButton__nav__browsing').length && !reviewingEligibility) {
                        $('#buttonPanelThree > button[id^="CaseEligibilityResult"]:not(#CaseEligibilityResultSelectionSelf)').addClass('hidden')
                    }
                }
            }
        } // Highlight_Row_2_3_Buttons
        // Activate_Row_3_from_click_or_page_load
        function fRowThreeButtonsString(idOfRowTwoGroupButton) {
            let vRowThreeButtonsString = ""
            for (let button in oRowThreeButtons[idOfRowTwoGroupButton]) {
                let buttonProperties = oRowThreeButtons[idOfRowTwoGroupButton][button]
                buttonProperties.classes = buttonProperties.buttonName === "+" ? "cButton cButton__nav cButton__nav__plus" : "cButton cButton__nav"
                let vButtonHtml = '<button type="button" tabindex="-1" class="' + buttonProperties.classes + '" id="' + buttonProperties.buttonId + '" data-how-to-open="' + buttonProperties.opensIn + '" data-page-name="' + buttonProperties.pageWithoutDotHtm + '" data-page-link-using-id="' + buttonProperties.parentId + '">' + buttonProperties.buttonName + '</button>'
                vRowThreeButtonsString += vButtonHtml
            }
            buttonDivThree.insertAdjacentHTML("beforeend", vRowThreeButtonsString)
        } // Activate_Row_3_from_click_or_page_load

        function findPageParent() {
            for (let grouping in oRowThreeButtons) {
                for (let page in oRowThreeButtons[grouping]) {
                    if (Object.hasOwn(oRowThreeButtons[grouping][page], "pageWithoutDotHtm") && oRowThreeButtons[grouping][page].pageWithoutDotHtm === thisPageName) {
                        if (notEditMode && $('#buttonPanelThree').children().length === 0) { fRowThreeButtonsString(oRowThreeButtons[grouping][page].rowTwoParent) }
                        return [grouping, page]
                    }
                    else {
                        for (let page in oRowOneButtons) {
                            if (Object.hasOwn(oRowOneButtons[page], "gotoPage") && oRowOneButtons[page].gotoPage === thisPageName) {
                                return ["undefined", page]
                            }
                        }
                    }
                }
            }
        }

        document.querySelector('.primary-navigation').addEventListener('click', (event) => {
            if (event.target.dataset.howToOpen === "_self") { document.querySelector('body').style.opacity = ".8" }
            if (event.target.tagName === 'BUTTON') {
                if (event.target.parentNode.id !== "buttonPanelThree") { document.querySelectorAll('.cButton__nav__browsing').forEach((e) => e?.classList.remove('cButton__nav__browsing')) }
                document.querySelector('.primary-navigation-row button#' + event.target.id + ':not(.cButton__nav__open-page):not(#buttonPanelOneNTF>button):not([data-how-to-open="_blank"])')?.classList.add("cButton__nav__browsing")
                if (document.querySelectorAll('#eligibilityButtons.cButton__nav__open-page, #eligibilityButtons.cButton__nav__browsing').length && !reviewingEligibility) {
                    document.querySelectorAll('#buttonPanelThree > button[id^="CaseEligibilityResult"]:not(#CaseEligibilityResultSelectionSelf)').forEach((e) => e?.classList.add('hidden'))
                }
            }
        })
        highlightPageAndCategory() // to highlight on page load

        buttonDivThree.addEventListener('click', function(event) {
            if (notEditMode && event.target.tagName?.toLowerCase() === 'button') { gotoPage(event.target.id) }
        })
        // Activate row three from click or page load

        // Use_Button_Click_Id_to_Load_href
        function gotoPage(loadThisPage) {
            let loadThisPageNode = document.getElementById(loadThisPage)
            let loadThisPageNodeName = loadThisPageNode.dataset.pageName
            let listPages = ["Alerts", "ActiveCaseList", "ClientSearch", "InactiveCaseList", "PendingCaseList", "ProviderRegistrationList", "ProviderSearch"]
            if ( listPages.includes(loadThisPageNodeName) ) { window.open(document.getElementById(loadThisPageNode.dataset.pageLinkUsingId).firstElementChild.href, loadThisPageNode.dataset.howToOpen); return } //Going to a list page...
            if ( listPages.includes(thisPageName) ) {
                if (["ProviderRegistrationList.htm", "ProviderSearch.htm"].includes(thisPageNameHtm) || (thisPageNameHtm === "Alerts.htm" && (document.querySelector('#caseOrProviderAlertsTable > tbody > tr.selected > td:nth-of-type(1)')?.textContent === "Provider")) ) {
                    if (loadThisPageNode.id.indexOf("Provider") === 0) { window.open('/ChildCare/' + loadThisPageNode.dataset.pageName + '.htm' + fGetProviderParameters(), loadThisPageNode.dataset.howToOpen) }
                } else {
                    let caseParameters = fGetCaseParameters() ?? ""
                    window.open('/ChildCare/' + loadThisPageNode.dataset.pageName + '.htm' + caseParameters, loadThisPageNode.dataset.howToOpen)
                }
            } else {
                if (notEditMode) { window.open(document.getElementById(loadThisPageNode.dataset.pageLinkUsingId).firstElementChild.href, loadThisPageNode.dataset.howToOpen) }
                else if (!notEditMode && (loadThisPageNode.dataset.howToOpen === "_blank")) {
                    let maybeParm2 = caseId ? "?parm2=" + caseId : ''
                    window.open('/ChildCare/' + loadThisPageNode.dataset.pageName + '.htm' + maybeParm2, "_blank")
                }
            }
        } // SECTION_END Use_Button_Click_Id_to_Load_href

        if (("getProviderOverview.htm").includes(thisPageNameHtm)) {
            document.querySelector('#providerButtons').click()
            document.querySelector('#ProviderOverviewSelf').classList.add('cButton__nav__open-page')
        }
        // SECTION_START New_Tab_Case_Number_Field
        function newTabFieldButtons() {
            let buttonDivOneNTF = document.getElementById("buttonPanelOneNTF")
            document.getElementById('buttonPanelOneNTF').insertAdjacentHTML('afterbegin', `
<input id="newTabField" list="history" autocomplete="off" class="form-control" placeholder="Case #" style="width: 10ch;"></input>
<button type="button" data-page-name="CaseNotes" id="FieldNotesNT" class="cButton cButton__nav">Notes</button>
<button type="button" data-page-name="CaseOverview" id="FieldOverviewNT" class="cButton cButton__nav">Overview</button>
`)
            buttonDivOneNTF.addEventListener('click', function(event) {
                if (event.target.closest('button')?.tagName?.toLowerCase() === 'button' && (/\b\d{1,8}\b/).test(document.getElementById('newTabField').value)) {
                    event.preventDefault()
                    openCaseNumber(event.target.dataset.pageName, document.getElementById('newTabField').value)
                }
            })
            $('#newTabField').keydown(function(e) {
                if (e.target.value.length > 7) {
                    e.stopImmediatePropagation()
                    if (!['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'v', 'Home', 'End', 'a', 'z'].includes(e.key)) {
                        e.preventDefault()
                        return false
                    }
                }
                e.stopImmediatePropagation()
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        window.open('/ChildCare/CaseNotes.htm?parm2=' + $('#newTabField').val(), '_blank');
                        break
                    case 'o':
                    case 'Enter':
                        e.preventDefault();
                        window.open('/ChildCare/CaseOverview.htm?parm2=' + $('#newTabField').val(), '_blank');
                        break
                }
            })
        };
        function openCaseNumber(pageName, enteredCaseNumber) {
            if (pageName == "CaseNotes") {
                window.open('/ChildCare/CaseNotes.htm?parm2=' + enteredCaseNumber, '_blank');
            } else {
                window.open('/ChildCare/CaseOverview.htm?parm2=' + enteredCaseNumber, '_blank');
            };
        };
        newTabFieldButtons();
        !notEditMode && (document.querySelectorAll('#buttonPanelTwo, #buttonPanelThree').forEach((e) => e.classList.add('hidden') )); // SECTION_END New_Tab_Case_Number_Field

        // SECTION_START Reverse_Period_Options_order
        let selectPeriodToReverse = document.getElementById("selectPeriod");
        if (notEditMode && selectPeriodToReverse && !selectPeriodToReverse?.disabled) { selectPeriodReversal(selectPeriodToReverse) } // SECTION_END Reverse_Period_Options_order
    } catch (error) { console.trace(error) }
} // SECTION_END PRIMARY_NAVIGATION_BUTTONS
//
function selectPeriodReversal(selectPeriod) {
    if (selectPeriod) {
        $('#selectPeriod option').each(function() {
            $(this).prependTo($(this).parent())
        })
    }
};
// ====================================================================================================
// ///////////////////////////// PRIMARY_NAVIGATION_BUTTONS SECTION_END \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// ====================================================================================================
// SECTION_START Period_Dropdown_Next_Prev_Buttons
function nextPrevPeriodButtons() {
    try {
        if (notEditMode) {
            let currentPeriod = document.querySelector('#selectPeriod').value
            if (reviewingEligibility || thisPageNameHtm.indexOf("CaseApplicationInitiation.htm") > -1 || $('#submit').attr('disabled') === 'disabled') { return }
            let lastAvailablePeriod = document.querySelector('#selectPeriod > option:first-child').value
            let selectPeriodDropdown = document.getElementById('selectPeriod');
            let selectPeriodParent = document.getElementById('selectPeriod').parentNode;
            const buttonsNextPrev = [ //"Button Text", "ButtonId", "Next|Prev", "Stay|Go", "Left|Right - side of dropdown"]
                ["«", "backGoSelect", "Prev", "Go", "Left"],
                ["‹", "backSelect", "Prev", "Stay", "Right"],
                ["»", "forwardGoSelect", "Next", "Go", "Right"],
                ["›", "forwardSelect", "Next", "Stay", "Left"],
            ];
            for (let i = 0; i < buttonsNextPrev.length; i++) { //optimize
                let btnNavigation = document.createElement('button');
                btnNavigation.textContent = buttonsNextPrev[i][0];
                btnNavigation.id = buttonsNextPrev[i][1];
                btnNavigation.tabIndex = '-1';
                btnNavigation.type = 'button';
                btnNavigation.dataset.NextOrPrev = buttonsNextPrev[i][2]
                btnNavigation.dataset.StayOrGo = buttonsNextPrev[i][3]
                btnNavigation.className = 'npp-button'
                buttonsNextPrev[i][2] === 'Prev' ? selectPeriodParent.insertBefore(btnNavigation, selectPeriodDropdown) : selectPeriodParent.insertBefore(btnNavigation, selectPeriodDropdown.nextSibling)
            };
            currentPeriod === lastAvailablePeriod && document.getElementById('forwardGoSelect').classList.add('cButton__disabled')
            function checkPeriodMobility() {
                document.querySelector('#selectPeriod').value === lastAvailablePeriod ? $('#forwardSelect').addClass('cButton__disabled') : $('#forwardSelect').removeClass('cButton__disabled')
            }
            checkPeriodMobility()

            document.getElementById('selectPeriod').parentNode.addEventListener('click', function(event) {
                if (event.target.closest('button')?.tagName.toLowerCase() === 'button') { selectNextPrev(event.target.closest('button').id) }
            })
            function selectNextPrev(clickedButton) { //Subtracting goes up/forward dates;
                if (document.getElementById(clickedButton).dataset.NextOrPrev === "Next") {
                    if (selectPeriodDropdown.selectedIndex === 0) { // top of list
                        if (document.getElementById(clickedButton).dataset.StayOrGo === "Go") { document.getElementById('caseInputSubmit').click(); return }
                        else { return }
                    }
                    selectPeriodDropdown.selectedIndex--;
                    if (document.getElementById(clickedButton).dataset.StayOrGo === "Go") { document.getElementById('caseInputSubmit').click() }
                } else if (document.getElementById(clickedButton).dataset.NextOrPrev === "Prev") {
                    selectPeriodDropdown.selectedIndex++;
                    if (document.getElementById(clickedButton).dataset.StayOrGo === "Go") { document.getElementById('caseInputSubmit').click() }
                }
                checkPeriodMobility()
            };
        }
    } catch (error) { console.trace("nextPrevPeriodButtons", error) }
} // SECTION_END Period_Dropdown_Next_Prev_Buttons
document.querySelector('#selectPeriod:not([disabled], [readonly], [type=hidden])') && nextPrevPeriodButtons() // SECTION_END Period_Dropdown_Next_Prev_Buttons
queueMicrotask(() => { document.querySelector('body')?.addEventListener('submit', function() { document.querySelector('body').style.opacity = ".8" }) }) // Dim_Page_On_Submit
// =================================================================================================================
// SECTION_END CUSTOM_NAVIGATION  (THE MEC2NAVIGATION SCRIPT SHOULD MIMIC THE ABOVE)  SECTION_END NAVIGATION_BUTTONS
// =================================================================================================================
