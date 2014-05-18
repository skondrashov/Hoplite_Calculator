var showUnavailable = true;

var health = document.createElement('img');
health.src = "res/48px-health.png";

var acquired = {};

var HP = 3;
var altars = 15;

// generate a DOM element for every ability to use for display
(function(){
	for (var name in abilities)
	{
		var ability = abilities[name];
		var element = document.createElement('div')
		,	icon = document.createElement('img')
		,	text = document.createElement('div')
		,	title = document.createElement('div')
		,	description = document.createElement('div')
		;

		$(element).addClass('ability_container');
		$(icon).addClass('ability_icon');
		$(text).addClass('ability_text');
		$(title).addClass('ability_name');
		$(description).addClass('ability_description');

		$(element).append(icon);
		$(element).append(text);
		$(text).append(title);
		$(text).append(description);

		icon.src = "res/48px-" + ability.icon + ".png";
		title.innerHTML = name;
		description.innerHTML = ability.text;
		
		if (ability.cost)
		{
			var cost = document.createElement('div');
			$( cost ).addClass('ability_cost');
			cost.innerHTML = 'Sacrifice required ';
			var heart = document.createElement('span');
			$( heart ).addClass('heart_text');
			for (var i = 0; i < ability.cost; ++i)
			{
				heart.innerHTML += "\u2665";
			}
			$(cost).append(heart);
			$(text).append(cost);
		}

		if (name != "Fortitude") {(function(){
			var closure = ability;
			$(element).click(function(){
				if (closure.acquired)
					refund(closure);
				else
					acquire(closure);
			});
		})();}
		
		ability.html = element;
	}
})();

$( document ).ready(function() {
	$("#refund_health").click(function(){
		if (HP > 1 && altars < 15) {
			HP--;
			altars++;
			update();
		}
	});
	$("#acquire_health").click(function(){
		if (altars > 0) {
			HP++;
			altars--;
			update();
		}
	});
	for (var i in abilities)
		$( "#pool" ).append(abilities[i].html);
	update();
});

function refund(ability) {
	ability.acquired = false;
	$(ability.html).show();
	HP += ability.cost;
	altars++;
	update();
}

// performs actions tied to acquiring a new ability
function acquire(ability) {
	if (ability.cost < HP && altars > 0) {

		var htmlCopy = $(ability.html).clone();	// make a copy of our ability info box
		$(htmlCopy).click(function(){			// add a click handler to refund the ability onclick
			$(htmlCopy).remove();
			refund(ability);
		});
		$( "#acquired" ).append(htmlCopy);		// add the new box to the acquired ability list

		$(ability.html).hide();					// hide the purchased ability

		ability.acquired = true;

		// apply HP/altar costs
		HP -= ability.cost;
		altars--;

		update();
	}
}

// checks and updates all page visuals
function update(ability) {
	var diff = (HP - $("#health>img").length);		// the difference between the actual and displayed HP values

	// these for loops also act as "if" statements
	// only the relevant one will ever runo
	// or neither if the number of icons == HP
	for (var i = 0; i < diff; ++i) {				// adds health icons to match current health
		$( "#health" ).append($(health).clone());
	}
	for (var i = 0; i > diff; --i) {				// removes health icons to match current health
		$("#health>img:last-child").remove();
	}

	$("#altars").html("Altars Left: " + altars);	// updates the altar count

	// greys out unavailable abilities in the pool and colors available abilities
	// if an ability is greyed out for any single reason, all other checks are skipped with "continue"
	for (var i in abilities) {
		var ability = abilities[i];
		
		// greys based on health cost
		if (ability.cost > HP - 1 && !ability.acquired) {
			$( ability.html ).addClass('grayscale');
			continue;
		}
		$( ability.html ).removeClass('grayscale');	// if the ability was never greyed out, color it
	}
}