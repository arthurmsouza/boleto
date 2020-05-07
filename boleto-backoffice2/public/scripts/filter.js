$(document).ready(function () {
	$("#search").keyup(function () {
		console.log(document.location.href);
		filter = new RegExp($(this).val(), 'i');
		$("#tab tbody tr").filter(function () {
			$(this).each(function () {
				found = false;
				$(this).children().each(function () {
					content = $(this).html();
					if (content.match(filter)) {
						found = true
					}
				});
				if (found) {
					$(this).show();

				}
				else {
					$(this).hide();
				}
			});
		});
	});
	$("#search02").keyup(function () {
		console.log("search02");
		filter = new RegExp($(this).val(), 'i');
		$("#tab1 tbody tr").filter(function () {
			$(this).each(function () {
				found = false;
				$(this).children().each(function () {
					content = $(this).html();
					if (content.match(filter)) {
						found = true
					}
				});
				if (!found) {
					$(this).hide();
				}
				else {
					$(this).show();
				}
			});
		});
	});
	$("#pesquisa").keyup(function () {
		console.log("pesquisa");
		filter = new RegExp($(this).val(), 'i');
		$("#tab_regulator tbody tr").filter(function () {
			$(this).each(function () {
				found = false;
				$(this).children().each(function () {
					content = $(this).html();
					if (content.match(filter)) {
						found = true
					}
				});
				if (!found) {
					$(this).hide();
				}
				else {
					$(this).show();
				}
			});
		});
	});

});

	// $("#search").keyup(function () {
	// 	filter = $(this).val();
	// 	console.log(filter);
	// 	$(".hash").filter(function () {
	// 		$(this).each(function () {
	// 				content = $(this).html();
	// 				found = false;
	// 				if (filter == content) {
	// 					found = true
	// 				}
	// 			if (found) {
	// 				 $(this).show();
	// 				// $('#tab').show();
	// 				console.log("entrou if");
	// 				found = true;
	// 			}
	// 			else {
	// 				$(this).hide();
	// 				console.log("entrou else");
	// 			}
	// 		});
	// 	});
	// });








