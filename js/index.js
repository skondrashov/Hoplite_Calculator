var hideUnavailable = false;						// toggles hiding vs greying out unavailable prayers

// a heart icon for copying into the health bar when we need it
var health = document.createElement('img');
health.src = "res/48px-health.png";

// stats!
var HP = 3
,	altars = 15
,	energy = 100
,	range = 2
;

function setHideUnavailable (cb) {
	hideUnavailable = cb.checked;
	for (var i in prayers) {
		var prayer = prayers[i];
		if (!prayer.enabled) {
			if (hideUnavailable)
				$(prayer.html).hide();
			else 
				$(prayer.html).show();
		}
	}
}

function setHideDescriptions(cb) {
	if (cb.checked)
		$(".prayer_description").hide();
	else
		$(".prayer_description").show();
}

// generate a DOM element for every prayer to use for display
(function(){
	for (var name in prayers) {
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

		if (prayer.cost) {
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
	for (var i = 0; i < prayerTypes.length; ++i) {
		var typeList = prayerTypes[i];
		for (var j = 0; j < typeList.length; ++j) {
			if (prayers[typeList[j]].types === undefined)
				prayers[typeList[j]].types = [];
			prayers[typeList[j]].types.push(i);
		}
	}

	// marks all prayers with their series (if they belong to one) based on the prayerSeries object
	// also marks their position in the series, referred to by "tier"
	for (var i = 0; i < prayerSeries.length; ++i) {
		var series = prayerSeries[i];
		for (var j = 0; j < series.length; ++j) {
			if (prayers[series[j]].series === undefined)
				prayers[series[j]].series = [];
			if (prayers[series[j]].tier === undefined)
				prayers[series[j]].tier = [];
			prayers[series[j]].series.push(i);
			prayers[series[j]].tier.push(j);
			if (j)
				prayers[series[j]].needsPrereq = true;
		}
	}

	// fills the warning box with possible build warnings, but hides them, to be turned on later if they're needed
	// replaces the warning JSON with DOM objects for simple manipulation
	for (var i in warnings) {
		var element = document.createElement('div');
		$(element).addClass('warning');
		$(element).html("Warning: " + warnings[i]);
		$(element).hide();
		warnings[i] = element;
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
	for (var i in prayers) {
		$("#pool").append(prayers[i].html);
	}
	for (var i in warnings)
		$("#warnings").append(warnings[i]);
	update();
});

function refund(prayer) {
	if (prayer.enabled) {
		prayer.acquired = false;

		$(prayer.htmlCopy).remove();				// remove the copy from the acquired prayer list

		// refund HP/altar costs
		HP += prayer.cost;
		altars++;
		
		// if the prayer belongs to a type, unflag the members of that type
		if (prayer.types) {
			for (var j = 0; j < prayer.types.length; ++j) {			
				for (var i = 0; i < prayerTypes[prayer.types[j]].length; ++i) {
					prayers[prayerTypes[prayer.types[j]][i]].typeConflict = false;
				}
			}
		}

		// if the prayer belongs to a series, update the series' prerequisite flags
		if (prayer.series) {
			for (var i = 0; i < prayer.series.length; ++i) {
				if (prayer.tier[i]+1 < prayerSeries[prayer.series[i]].length)
					prayers[prayerSeries[prayer.series[i]][prayer.tier[i]+1]].needsPrereq = true;

				// allows prerequisite to be refunded
				if (prayer.tier[i]) {
					prayers[prayerSeries[prayer.series[i]][prayer.tier[i]-1]].noRefund = false;
				}
			}
		}

		update();
	}
}

// performs actions tied to acquiring a new prayer
function acquire(prayer) {
	if (prayer.enabled) {
		prayer.acquired = true;

		prayer.htmlCopy = $(prayer.html).clone(true);	// make a copy of our prayer info box
		$("#acquired").append(prayer.htmlCopy);			// add the new box to the acquired prayer list

		// apply HP/altar costs
		HP -= prayer.cost;
		altars--;

		// if the prayer belongs to a type, flag all prayers of that type for disabling
		if (prayer.types) {
			for (var j = 0; j < prayer.types.length; ++j) {
				for (var i = 0; i < prayerTypes[prayer.types[j]].length; ++i) {
					if (prayers[prayerTypes[prayer.types[j]][i]] != prayer)
						prayers[prayerTypes[prayer.types[j]][i]].typeConflict = true;
				}
			}
		}

		// if the prayer belongs to a series, update the series' prerequisite flags
		if (prayer.series) {
			for (var i = 0; i < prayer.series.length; ++i) {
				if (prayer.tier[i]+1 < prayerSeries[prayer.series[i]].length)
					prayers[prayerSeries[prayer.series[i]][prayer.tier[i]+1]].needsPrereq = false;

				// stop prerequisite from being refunded
				if (prayer.tier[i]) {
					prayers[prayerSeries[prayer.series[i]][prayer.tier[i]-1]].noRefund = true;
				}
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
		$("#health").append($(health).clone());
	}
	for (var i = 0; i > diff; --i) {				// removes health icons to match current health
		$("#health>img:last-child").remove();
	}

	$("#altars").html("Altars Left: " + altars);	// updates the altar count

	// greys out unavailable prayers in the pool and colors available prayers
	for (var i in prayers) {
		var prayer = prayers[i];

		if (prayer.noRefund) {						// is this a prerequisite for an acquired ability?
			prayer.enabled = false;
		} else
			prayer.enabled = true;

		if (prayer.acquired) {
			$(prayer.html).addClass('acquired');
			continue;
		}
		else
			$(prayer.html).removeClass('acquired');

		if (	prayer.cost > HP - 1				// health costs
			||	altars == 0							// altar availability
			||	prayer.typeConflict					// type conflicts
			||	prayer.needsPrereq					// prerequisite fulfillment
		)
			disable(prayer);
		else
			enable(prayer);
	}

	// displays warnings about the build to the user
	if (HP > 8)
		$(warnings["MAX_HP"]).show();
	else
		$(warnings["MAX_HP"]).hide();

	if (prayers["Patience"].acquired || prayers["Protection"].acquired)
		$(warnings["RARE"]).show();
	else
		$(warnings["RARE"]).hide();

	if (prayers["Superior Energy III"].acquired || prayers["Greater Bloodlust V"].acquired)
		$(warnings["LEAPAGE"]).show();
	else
		$(warnings["LEAPAGE"]).hide();
		
}

function disable(prayer) {
	prayer.enabled = false;
	$(prayer.html).addClass('grayscale');
	if (hideUnavailable)
		$(prayer.html).hide();
}

function enable(prayer) {
	prayer.enabled = true;
	$(prayer.html).removeClass('grayscale');
	$(prayer.html).show();
}