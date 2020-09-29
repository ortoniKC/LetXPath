$(document).ready(function () {
    chrome.storage.local.get(['langID'], (result) => {
        if (result.langID != undefined) {
            // setStorage({ lang: radioValue, langID: radioID });
            document.getElementById(result.langID).checked = true;
        } else {
            setStorage({ lang: 'Selenium - Java', langID: 'javas' });
            document.getElementById("javas").checked = true;
        }
    });
    $("input[type='radio']").click(function () {
        let ip = $("input[name='snippetLanguage']:checked");
        let radioValue = ip.val();
        let radioID = ip.attr("id");
        setStorage({ lang: radioValue, langID: radioID });
        let toast = document.querySelector('.toast')
        toast.textContent = "Defalt Snippet has been changed to " + radioValue
        toast.classList.remove('d-hide')
        // $("#snippetnotification").append(notification);
    })
    // document.getElementsByClassName("delete")[0].addEventListener("click", () => {
    //     $("#snippetnotification").empty();
    // })
});

function setStorage(obj) {
    chrome.storage.local.set(obj, function () {
    });
}