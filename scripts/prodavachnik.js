function startApp() {
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewHome');
    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListAds").click(listAds);
    $("#linkCreateAd").click(showCreateAdView);
    $("#linkLogout").click(logoutUser);
    $("#buttonLoginUser").click(loginUser);
    $("#buttonRegisterUser").click(registerUser);
    $("#buttonCreateAd").click(getPublisher);
    $("#buttonEditAd").click(editAds);
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rJp-vHmze";
    const kinveyAppSecret =
        "4d96689f4fce4695b9d4f758f502c1c5";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    function showHideMenuLinks() {
        $("#linkHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkListAds").show();
            $("#linkCreateAd").show();
            $("#linkLogout").show();
        } else {
            // No logged in user
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkListAds").hide();
            $("#linkCreateAd").hide();
            $("#linkLogout").hide();
        }
    }
    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }
    function showHomeView() {
        showView('viewHome');
    }
    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }
    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }
    function showCreateAdView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }
    function loginUser() {
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAds();
            showInfo('Login successful.');
        }
    }


        function registerUser() {
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAds();
            showInfo('User registration successful.');
        }
    }
    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#loggedInUser').text(
            "Welcome, " + username + "!");
    }
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text("");
        showHideMenuLinks();
        showView('viewHome');
        showInfo('Logout successful.');
    }


    function listAds() {
        $('#ads').empty();
        showView('viewAds');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/adverts",
            headers: getKinveyUserAuthHeaders(),
            success: loadAdsSuccess,
            error: handleAjaxError
        });
        function loadAdsSuccess(ads) {
            showInfo('Advertisments loaded.');
            if (ads.length == 0) {
                $('#ads').text('No advertisments.');
            } else {
                let adsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>Title</th><th>Description</th>',
                        '<th>Publisher</th><th>Date Published</th><th>Price</th>'));
                for (let advert of ads)
                    appendAdsRow(advert, adsTable);
                $('#ads').append(adsTable);
            }
        }
        function appendAdsRow(advert, adsTable) {
            let links = [];
            if (advert._acl.creator == sessionStorage['userId']) {
                let deleteLink = $('<a href="#">[Delete]</a>')
                    .click(function () { deleteAds(advert) });
                let editLink = $('<a href="#">[Edit]</a>')
                    .click(function () { loadAdsForEdit(advert) });
                links = [deleteLink, ' ', editLink];
            }
            adsTable.append($('<tr>').append(
                $('<td>').text(advert.title),
                $('<td>').text(advert.description),
                $('<td>').text(advert.publisher),
                $('<td>').text(advert.date),
                $('<td>').text(advert.price),
                $('<td>').append(links)
            ));
        }


    }
    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }

    function getPublisher() {
        const kinvAuthHeaders = {'Authorization': "Kinvey " + sessionStorage.getItem('authToken')}
        const kinvUserUrl = `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`;
        $.ajax({
            method: "GET",
            url: kinvUserUrl,
            headers: kinvAuthHeaders,
            success: createAds,
            error: showError
        })

        function createAds(publisher) {
            let adsData = {
                title: $('#formCreateAd input[name=title]').val(),
                description: $('#formCreateAd textarea[name=description]').val(),
                publisher: publisher.username,
                date: $('#formCreateAd input[name=datePublished]').val(),
                price: $('#formCreateAd input[name=price]').val()
            };
            $.ajax({
                method: "POST",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/adverts",
                headers: getKinveyUserAuthHeaders(),
                data: adsData,
                success: createAdsSuccess,
                error: handleAjaxError
            });
            function createAdsSuccess(response) {
                listAds();
                showInfo('Advertisment created.');
            }


        }
    }
    
    function deleteAds(advert) {
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/adverts/" + advert._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteAdsSuccess,
            error: handleAjaxError
        });
        function deleteAdsSuccess(response) {
            listAds();
            showInfo('Advert deleted.');
        }
    }
    function loadAdsForEdit(advert) {
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/adverts/" + advert._id,
            headers: getKinveyUserAuthHeaders(),
            success: loadAdsForEditSuccess,
            error: handleAjaxError
        });
        function loadAdsForEditSuccess(advert) {
            $('#formEditAd input[name=id]').val(advert._id);
            $('#formEditAd input[name=title]').val(advert.title);
            $('#formEditAd input[name=publisher]').val(advert.publisher);
            $('#formEditBook textarea[name=description]')
                .val(advert.description);
            $('#formEditBook textarea[name=datePublished]')
                .val(advert.date);
            $('#formEditBook textarea[name=price]')
                .val(advert.price);
            showView('viewEditAd');
        }
    }
    function editAds() {
        let adsData = {
            title: $('#formEditAd input[name=title]').val(),
            description: $('#formEditAd textarea[name=description]').val(),
            publisher: sessionStorage.getItem('username'),
            date: $('#formEditAd input[name=datePublished]').val(),
            price: $('#formEditAd input[name=price]').val()
        };
        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey +
            "/adverts/" + $('#formEditAd input[name=id]').val(),
            headers: getKinveyUserAuthHeaders(),
            data: adsData,
            success: editAdsSuccess,
            error: handleAjaxError
        });

        function editAdsSuccess(response) {
            listAds();
            showInfo('Advert edited.');
        }
    }

}