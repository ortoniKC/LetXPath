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
    $('#tab_header ul li.item').on('click', function () {
        var number = $(this).data('option');
        $('#tab_header ul li.item').removeClass('is-active');
        $(this).addClass('is-active');
        $('#tab_container .container_item').removeClass('is-active');
        $('div[data-item="' + number + '"]').addClass('is-active');
    });

    $("input[type='radio']").click(function () {
        let ip = $("input[name='snippetLanguage']:checked");
        let radioValue = ip.val();
        let radioID = ip.attr("id");
        setStorage({ lang: radioValue, langID: radioID });
        let notification = `<div class="notification is-primary">
        Here after, you will get ${radioValue} snippet from LetXPath 😍
      </div>`
        $("#snippetnotification").empty();
        $("#snippetnotification").append(notification);
    })
    // document.getElementsByClassName("delete")[0].addEventListener("click", () => {
    //     $("#snippetnotification").empty();
    // })
});

function setStorage(obj) {
    chrome.storage.local.set(obj, function () {
        
    });
}