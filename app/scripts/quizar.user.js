function User(hash) {
	function getMiniImageUrl() { return this.imageUrl;}
	function getNormalImageUrl() { return this.imageUrl.replace("_mini", "_normal");}
	function getBiggerImageUrl() { return this.imageUrl.replace("_mini", "_bigger");}

	$.extend(this, hash, {
		"getMiniImageUrl" : getMiniImageUrl,
		"getNormalImageUrl" : getNormalImageUrl,
		"getBiggerImageUrl" : getBiggerImageUrl
	});
	clearHash(hash);
}
