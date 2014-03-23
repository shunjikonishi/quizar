function PagingBar($el, count, func, rowSize) {
	function prev() {
		if (offset > 0) {
			offset -= rowSize;
			func(offset, rowSize, false);
			buttonControl();
		}
	}
	function next() {
		if (offset + rowSize < count) {
			offset += rowSize;
			func(offset, rowSize, true);
			buttonControl();
		}
	}
	function buttonControl() {
		enableInput($btnPrev, offset > 0);
		enableInput($btnNext, offset + rowSize < count);
	}
	function recordCount() {
		if (arguments.length == 0) {
			return count;
		} else {
			count = arguments[0];
			return this;
		}
	}
	function swipeParams() {
		return {
			"swipeLeft": function(e) {
				next();
				e.stopImmediatePropagation();
			},
			"swipeRight": function(e) {
				prev();
				e.stopImmediatePropagation();
			},
			"tap": function (event, target) {
				if (SUPPORTS_TOUCH) {
					$(target).click();
				}
			}
		};
	}
	function release() {
		$btnPrev = null;
		$btnNext = null;
	}
	var offset = 0,
		$btnPrev = $el.find(".paging-bar-left"),
		$btnNext = $el.find(".paging-bar-right");
	rowSize = rowSize || 10;
	$btnPrev.click(prev);
	$btnNext.click(next);
	buttonControl();

	$.extend(this, {
		"prev" : prev,
		"next" : next,
		"recordCount" : recordCount,
		"swipeParams" : swipeParams,
		"release" : release
	})
}