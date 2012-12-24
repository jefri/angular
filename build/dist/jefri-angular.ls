unless window.$ is window.jQuery then throw "Seriously, load jQuery first, please."

angular.module \jQuery, []
	.factory \jQuery, ->
		window.jQuery

anguler.module \JEFRi, <[ jQuery ]>
angular.module \jefri,
	.factory \JEFRi, ->
		rt = new JEFRi.Runtime "context.json"
		JEFRi.Runtime:: <<<
			run: (which, ents)->
				t = new window.JEFRi.Transaction!
				t.add ents
				storeOptions =
					remote: @settings.ENDPOINT
					runtime: @
				s = new window.JEFRi.Stores.PostStore storeOptions
				s.execute which, t

			save: (ents)->
				@run 'persist', ents

			get: (spec={})->
				@run 'get', spec

			config: !(endpoint="/")->
				@settings.ENDPOINT = endpoint

		rt <<<
			settings:
				ENDPOINT: "/"

		rt
JefriProperty = ->
	restrict: \A
	link: !(scope, element, attrs)->
		[entity, property] = attrs.jefriProperty.split \.
		entity = scope[entity]

		switch element[0].nodeName
		| <[ SELECT ]> =>
			update = !(val)->
				element.find "option" .filter (-> $ this .attr(\value) is val or $ this .text! is val) .attr \selected, true
			element.change !->
				entity[property] element.val!
				try
					scope.$apply!
			entity.modified :> !(changed, value)->
				if _(changed).isArray! then [changed, value] = changed
				if changed is property then update value
			# Since Angular probably won't have the <option>s expanded, update at the end of the stack.
			setTimeout (-> update entity[property]!), 0
		| <[ INPUT ]> =>
			if 'radio' is element.attr 'type'
				update = !(val)->
					if val is element.val! then element.attr 'checked', 'checked'
				element.change !->
					entity[property] element.val!
					try
						scope.$apply!
				entity.modified :> !(changed, value)->
					if _(changed).isArray! then [changed, value] = changed
					if changed is property then update value
				# Since Angular probably won't have the {{value}}s expanded, update at the end of the stack.
				setTimeout (-> update entity[property]!), 0
				return # Seriously, get the hell out of this link function
			fallthrough
		| <[ INPUT TEXTAREA ]> =>
			element.val entity[property]!
			element.change !-> entity[property] element.val!
			entity.modified :> !-> element.val entity[property]!
		| <[ SPAN DIV P ]> => fallthrough
		| otherwise =>
			element.text entity[property]!
			entity.modified :> !-> element.text entity[property]!

angular.module \JEFRi
	.directive \jefriProperty, [\jQuery, JefriProperty]

Inline = ($, JEFRi) ->
	restrict: \E
	template: '<span>
				<span ng:hide="editing" ng:click="edit()">
					{{value}}
				</span>

				<span ng:show="editing && property">
					<input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" />
				</span>
				<span ng:show="editing && relationship">
					<select class="relationship" ng:model="to_id" ui-event="{blur:\'save()\'}">
						<option disabled>{{prompt}}:</option>
						<option ng:repeat="entity in options" value="{{ entity.id }}">{{ entity.name }}</option>
					</select>
				</span>
			</span>'
	replace: true
	scope: true
	controller: !($scope)->
		$scope.editing = no
		$scope.edit = !->
			$scope.editing = yes
		$scope.save = !->
			$scope.editing = no
	link: !(scope, element, attrs) ->
		entity = scope[attrs.entity || 'entity']
		def = entity._definition!
		if def.properties[attrs.property]
			scope.property = true
			scope.value = entity[attrs.property]! || attrs.default
			scope.$watch 'value', !->
				entity[attrs.property](scope.value)
		else if def.relationships[attrs.property]
			scope.relationship = true
			scope.prompt = attrs.prompt
			scope.to_id = entity[attrs.property]!id!
			scope.value = entity[attrs.property]![attrs.display]!
			scope.options = _(JEFRi.find def.relationships[attrs.property].to.type).map ->
				{id: it.id!, name: it[attrs.display]!}
			scope.$watch 'to_id', !->
				could = _(JEFRi.find _type: def.relationships[attrs.property].to.type).filter ->
					it.id! is scope.to_id
				entity[attrs.property] could[0]
				scope.value = entity[attrs.property]![attrs.display]!

angular.module \JEFRi
	.directive \inline, [\jQuery, \JEFRi, Inline]