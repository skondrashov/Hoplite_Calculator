var showUnavailable = true;						// toggles hiding vs greying out unavailable prayers

// a heart icon for copying into the health bar when we need it
var health = document.createElement('img');
health.src = "res/48px-health.png";

// stats!
var HP = 3
,	altars = 15
,	energy = 100
,	range = 2
;

// generate a DOM element for every prayer to use for display
(function(){
	for (var name in prayers)
	{
		var prayer = prayers[name];
		prayer.enabled = true;

		var element = document.createElement('div')
		,	icon = document.createElement('img')
		,	text = document.createElement('div')
		,	title = document.createElement('div')
		,	description = document.createElement('div')
		;

		$(element).addClass('prayer_container');
		$(icon).addClass('prayer_icon');
		$(text).addClass('prayer_text');
		$(title).addClass('prayer_name');
		$(description).addClass('prayer_description');

		$(element).append(icon);
		$(element).append(text);
		$(text).append(title);
		$(text).append(description);

		icon.src = "res/48px-" + prayer.icon + ".png";
		title.innerHTML = name;
		description.innerHTML = prayer.text;
		
		if (prayer.cost)
		{
			var cost = document.createElement('div');
			$( cost ).addClass('prayer_cost');
			cost.innerHTML = 'Sacrifice required ';
			var heart = document.createElement('span');
			$( heart ).addClass('heart_text');
			for (var i = 0; i < prayer.cost; ++i)
			{
				heart.innerHTML += "\u2665";
			}
			$(cost).append(heart);
			$(text).append(cost);
		}

		if (name != "Fortitude") {(function(){
			var closure = prayer;
			$(element).click(function(){
				if (closure.acquired)
					refund(closure);
				else
					acquire(closure);
			});
		})();}
		
		prayer.html = element;
	}

	// marks all prayers with their types (if they have one) based on the prayerTypes object
	for (var type in prayerTypes) {
		var typeList = prayerTypes[type];
		for (var i = 0; i < typeList.length; ++i) {
			prayers[typeList[i]].type = type;
		}
	}
})();

$(document).ready(function() {
	// refunds a Fortitude prayer if possible
	$("#refund_health").click(function(){
		// you can't refund the HP you start with (since you never prayed for it)
		if (
			HP > 1 && altars < 13
			|| HP > 2 && altars < 14
			|| HP > 3 && altars < 15
		) {
			HP--;
			altars++;
			update();
		}
	});
	// performs a Fortitude prayer if possible
	$("#acquire_health").click(function(){
		if (altars > 0) {
			HP++;
			altars--;
			update();
		}
	});
	for (var i in prayers)
		$( "#pool" ).append(prayers[i].html);
	update();
});

function refund(prayer) {
	// re-enable display of the prayer in the pool
	$(prayer.html).show();

	// refund HP/altar costs
	HP += prayer.cost;
	altars++;
	
	prayer.acquired = false;
	
	// if the prayer belongs to a type, unflag the members of that type
	if (prayer.type) {
		for (var i = 0; i < prayerTypes[prayer.type].length; ++i) {
			prayers[prayerTypes[prayer.type][i]].typeConflict = false;
		}
	}

	update();
}

// performs actions tied to acquiring a new prayer
function acquire(prayer) {
	if (prayer.enabled) {

		var htmlCopy = $(prayer.html).clone();	// make a copy of our prayer info box
		$(htmlCopy).click(function(){			// add a click handler to refund the prayer onclick
			$(htmlCopy).remove();
			refund(prayer);
		});
		$( "#acquired" ).append(htmlCopy);		// add the new box to the acquired prayer list

		$(prayer.html).hide();					// hide the purchased prayer

		// apply HP/altar costs
		HP -= prayer.cost;
		altars--;
		
		prayer.acquired = true;

		// if the prayer belongs to a type, flag all prayers of that type for disabling
		if (prayer.type) {
			for (var i = 0; i < prayerTypes[prayer.type].length; ++i) {
				prayers[prayerTypes[prayer.type][i]].typeConflict = true;
			}
		}

		update();
	}
}

// checks and updates all page visuals
function update() {
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

	// greys out unavailable prayers in the pool and colors available prayers
	for (var i in prayers) {
		var prayer = prayers[i];

		if (prayer.cost > HP - 1					// health costs
			|| prayer.typeConflict					// type conflicts
			|| altars == 0) {						// altar availability
			disable(prayer);
		}	else
			enable(prayer);
	}
}

function disable(prayer) {
	prayer.enabled = false;
	$(prayer.html).addClass('grayscale');
	if (!showUnavailable)
		$(prayer.html).hide();
}

function enable(prayer) {
	prayer.enabled = true;
	$(prayer.html).removeClass('grayscale');
	if (!prayer.acquired)
		$(prayer.html).show();
}