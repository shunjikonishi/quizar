function EffectDialog($el) {
	function show(msg, second) {
		if (!second) {
			second = 5;
		}
		$el.animateDialog(msg, {
			"name" : "rotateZoom",
			"duration" : second + "s"
		});
	}
	$.extend(this, {
		"show" : show
	});
}
