$(document).ready(function () {
    chrome.storage.local.get(['langID', 'customLang', 'clickvalue', 'sendvalue', 'textvalue', 'attrvalue'], (result) => {
        if (result.langID != undefined) {
            // setStorage({ lang: radioValue, langID: radioID });
            document.getElementById(result.langID).checked = true;
        }
        if (result.customLang != undefined) {
            // setStorage({ lang: radioValue, langID: radioID });
            document.getElementById(result.customLang).checked = true;
        } else {
            setStorage({ lang: 'Selenium - Java', langID: 'javas' });
            document.getElementById("javas").checked = true;
        }
        // set edited values in textarea
        if (result.clickvalue != undefined) {
            $("#click-s").val(result.clickvalue)
            $("#send-s").val(result.sendvalue)
            $("#text-s").val(result.textvalue)
            $("#attr-s").val(result.attrvalue)
        }



    });
    $("input[type='radio'][name='snippetLanguage']").click(function () {
        let ip = $("input[name='snippetLanguage']:checked");
        let radioValue = ip.val();
        let radioID = ip.attr("id");
        setStorage({ lang: radioValue, langID: radioID });
        let toast = document.querySelector('.toast')
        toast.textContent = "Default Snippet has been changed to " + radioValue
        toast.classList.remove('d-hide')
    })
    $("form").on("submit", function () {
        let ip = $("input[name='cssnippetLanguage']:checked");
        let customLang = ip.attr("id");
        setStorage({ 'customLang': customLang });
        let clickAct = $("#click-s");
        setStorage({ 'clickvalue': clickAct.val() });
        let sendAct = $("#send-s");
        setStorage({ 'sendvalue': sendAct.val() });
        let textAct = $("#text-s");
        setStorage({ 'textvalue': textAct.val() });
        let attrAct = $("#attr-s");
        setStorage({ 'attrvalue': attrAct.val() });
        alert('Success')
        // document.querySelector('.toast').classList.remove('d-hide');
        // document.querySelector(".toast").textContent = 'Success';
        // alert(clickAct.val(), sendAct.val(), textAct.val(), attrAct.val())
    })
});

function setStorage(obj) {
    chrome.storage.local.set(obj, function () {
    });
}