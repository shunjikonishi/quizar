function MakeRoom(app, userId, con) {
	function getParameterName($input) {
		return $input.attr("id").substring(5);
	}
	function update() {
		if (validator && validator.form()) {
			var data = editRoom || {
				"id" : -1, 
				"owner" : userId
			};
			$form.find(":input").each(function() {
				var $input = $(this),
					name = getParameterName($input);
				if ($input.is(":checkbox")) {
					data[name] = $input.is(":checked");
				} else if ($input.val()) {
					data[name] = $input.val();
				}
			})
			if (editRoom) {
				con.request({
					"command" : "updateRoom",
					"data" : data,
					"success" : function(data) {
						app.showMessage(MSG.successUpdate);
					}
				})
			} else {
				con.request({
					"command" : "makeRoom",
					"data" : data,
					"success" : function(data) {
						if (data.id) {
							con.close();
							location.href = "/room/" + data.id;
						}
					}
				})
			}
		}
	}
	function init($el) {
		if (roomId && !editRoom) {
			con.request({
				"command" : "getRoom",
				"data" : roomId,
				"success" : function(data) {
					editRoom = data;
					init($el);
				}
			})
			return;
		}
		$form = $("#make-room-form");
		copyIdToName($form.find(":input")).each(function() {
			var $input = $(this);
			if (editRoom) {
				var name = getParameterName($input);
				if (editRoom[name]) {
					if ($input.is(":checkbox")) {
						$input.attr("checked", "checked");
					} else {
						$input.val(editRoom[name]);
					}
				}
			}
		})
		validator = $form.validate({
			"rules" : {
				"room-name" : {
					"required" : true,
					"maxlength" : 100
				},
				"room-tags" : {
					"maxlength" : 100
				},
				"room-hashtag" : {
					"maxlength" : 20
				},
				"room-description" : {
					"maxlength" : 400
				}
			},
			"focusInvalid" : true
		});
		var $btnUpdate = $("#btn-make-room").click(update),
			$desc = $("#make-room-desc");
		if (editRoom) {
			$("#room-admin").show();
			$desc.text(MSG.makeRoomDescForEdit);
			$btnUpdate.text(MSG.update);
		} else {
			$("#room-admin").hide();
			$desc.text(MSG.makeRoomDescForCreate);
			$btnUpdate.text(MSG.create);
		}
		optionControl($el);
	}
	function clear() {
		$form = null;
		validator = null;
		roomId = 0;
		editRoom = null;
	}
	var $form = null,
		roomId = 0,
		editRoom = null,
		validator = null;

	$.extend(this, {
		"init" : init,
		"clear" : clear,
		"edit" : function(id) { roomId = id;}
	})
}
