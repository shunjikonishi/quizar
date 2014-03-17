function User(hash) {
	function getMiniImageUrl() { return this.imageUrl;}

	$.extend(this, hash, {
		"getMiniImageUrl" : getMiniImageUrl
	});
	clearHash(hash);
}
