$(document).ready(function () {
    $(".expand").click(function () {
        // var $row = $(this).closest("tbody");    // Find the row
        // var $tds = $row.find("tr").next("tr");
        $(this).closest("tr").next("tr").toggleClass("expandRow collapseRow");
    });

    $("a#link-pgto.svg").click(function () {
        $(".expandRow").toggleClass("expandRow collapseRow");
    });
    $("#search").click(function () {
        $(".expandRow").toggleClass("expandRow collapseRow");
    });

    $user = $("#user").html();
    console.log($user);
    if ($user == 'Itaú') {
        $("#sidenav").css("background", "#eb6f31");
        $("#list_sidenav").css("background", "#eb6f31");
        $("a#link-user label").css("width", "4em");
        $("a#link-user").append('<img src="../images/itau.png">');
        // $("a#link-user.svg").css("background", "#ff9900");
    } else if ($user == 'Bradesco') {
        $("#sidenav").css("background", "#2f539c");
        $("#list_sidenav").css("background", "#2f539c");
        $("a#link-user label").css("width", "5.5em");
        $("a#link-user").append('<img src="../images/bradesco.png">');
    } else if ($user == 'Banco do Brasil') {
        $("#sidenav").css("background", "#23569c");
        $("#list_sidenav").css("background", "#23569c");
        $("a#link-user label").css("width", "5em");
        $("a#link-user label").css("font-size", "12px");
        $("a#link-user").append('<img src="../images/bb.png">');

    } else {
        $("#sidenav").css("background", "#ff0000 ");
        $("#list_sidenav").css("background", "#ff0000 ");
        $("a#link-user label").css("width", "5.5em");
        $("a#link-user").append('<img src="../images/santander.png">');
    }
});