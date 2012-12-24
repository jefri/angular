Short = ->
	(id)->
		"(#{id.substring 0, 8})"

angular.module \JEFRi
	.filter \shortId, Short
