unless window.$ is window.jQuery then throw "Seriously, load jQuery first, please."

angular.module \jQuery, []
	.factory \jQuery, ->
		window.jQuery

angular.module \jefri, <[ jQuery ]>
