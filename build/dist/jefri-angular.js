(function(){
  var JefriProperty, controller, Inline, prepareHandler$ = function (o){
        o.__event_handler = o.__event_handler || [];
        o.__event_advisor = o.__event_advisor || [];
      }, observe$ = function (callback){
        prepareHandler$(this);
        this.__event_handler.push(callback);
      };
  if (window.$ !== window.jQuery) {
    throw "Seriously, load jQuery first, please.";
  }
  angular.module('jQuery', []).factory('jQuery', function(){
    return window.jQuery;
  });
  angular.module('JEFRi', ['jQuery']);
  angular.module('JEFRi').factory('JEFRi', function(){
    var rt, ref$;
    rt = new JEFRi.Runtime("context.json");
    ref$ = JEFRi.Runtime.prototype;
    ref$.run = function(which, ents){
      var t, storeOptions, s;
      t = new window.JEFRi.Transaction();
      t.add(ents);
      storeOptions = {
        remote: this.settings.ENDPOINT,
        runtime: this
      };
      s = new window.JEFRi.Stores.PostStore(storeOptions);
      return s.execute(which, t);
    };
    ref$.save = function(ents){
      return this.run('persist', ents);
    };
    ref$.get = function(spec){
      spec == null && (spec = {});
      return this.run('get', spec);
    };
    ref$.config = function(endpoint){
      endpoint == null && (endpoint = "/");
      this.settings.ENDPOINT = endpoint;
    };
    rt.settings = {
      ENDPOINT: "/"
    };
    return rt;
  });
  JefriProperty = function(){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        var ref$, entity, property, update;
        ref$ = attrs.jefriProperty.split('.'), entity = ref$[0], property = ref$[1];
        entity = scope[entity];
        switch (element[0].nodeName) {
        case 'SELECT':
          update = function(val){
            element.find("option").filter(function(){
              return $(this).attr('value') === val || $(this).text() === val;
            }).attr('selected', true);
          };
          element.change(function(){
            entity[property](element.val());
            try {
              scope.$apply();
            } catch (e$) {}
          });
          observe$.call(entity.modified = entity.modified || {}, function(changed, value){
            var ref$;
            if (_(changed).isArray()) {
              ref$ = changed, changed = ref$[0], value = ref$[1];
            }
            if (changed === property) {
              update(value);
            }
          }, entity);
          setTimeout(function(){
            return update(entity[property]());
          }, 0);
          break;
        case 'INPUT':
          if ('radio' === element.attr('type')) {
            update = function(val){
              if (val === element.val()) {
                element.attr('checked', 'checked');
              }
            };
            element.change(function(){
              entity[property](element.val());
              try {
                scope.$apply();
              } catch (e$) {}
            });
            observe$.call(entity.modified = entity.modified || {}, function(changed, value){
              var ref$;
              if (_(changed).isArray()) {
                ref$ = changed, changed = ref$[0], value = ref$[1];
              }
              if (changed === property) {
                update(value);
              }
            }, entity);
            setTimeout(function(){
              return update(entity[property]());
            }, 0);
            return;
          }
          // fallthrough
        case 'INPUT':
        case 'TEXTAREA':
          element.val(entity[property]());
          element.change(function(){
            entity[property](element.val());
          });
          observe$.call(entity.modified = entity.modified || {}, function(){
            element.val(entity[property]());
          }, entity);
          break;
        case 'SPAN':
        case 'DIV':
        case 'P':
          // fallthrough
        default:
          element.text(entity[property]());
          observe$.call(entity.modified = entity.modified || {}, function(){
            element.text(entity[property]());
          }, entity);
        }
      }
    };
  };
  angular.module('JEFRi').directive('jefriProperty', ['jQuery', JefriProperty]);
  controller = function($scope){
    $scope.editing = false;
    $scope.edit = function(){
      $scope.editing = true;
    };
    $scope.save = function(){
      $scope.editing = false;
    };
  };
  controller.$inject = ['$scope'];
  Inline = function($, JEFRi){
    return {
      restrict: 'E',
      template: '<span><span ng:hide="editing" ng:click="edit()">{{value}}</span><span ng:show="editing && property"><input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" /></span><span ng:show="editing && relationship"><select class="relationship" ng:model="to_id" ui-event="{blur:\'save()\'}"><option disabled>{{prompt}}:</option><option ng:repeat="entity in options" value="{{ entity.id }}">{{ entity.name }}</option></select></span></span>',
      replace: true,
      scope: true,
      controller: controller,
      link: function(scope, element, attrs){
        var entity, def;
        entity = scope[attrs.entity || 'entity'];
        def = entity._definition();
        if (def.properties[attrs.property]) {
          scope.property = true;
          scope.value = entity[attrs.property]() || attrs['default'];
          scope.$watch('value', function(){
            entity[attrs.property](scope.value);
          });
        } else if (def.relationships[attrs.property]) {
          scope.relationship = true;
          scope.prompt = attrs.prompt;
          scope.to_id = entity[attrs.property]().id();
          scope.value = entity[attrs.property]()[attrs.display]();
          scope.options = _(JEFRi.find(def.relationships[attrs.property].to.type)).map(function(it){
            return {
              id: it.id(),
              name: it[attrs.display]()
            };
          });
          scope.$watch('to_id', function(){
            var could;
            could = _(JEFRi.find({
              _type: def.relationships[attrs.property].to.type
            })).filter(function(it){
              return it.id() === scope.to_id;
            });
            entity[attrs.property](could[0]);
            scope.value = entity[attrs.property]()[attrs.display]();
          });
        }
      }
    };
  };
  angular.module('JEFRi').directive('inline', ['jQuery', 'JEFRi', Inline]);
}).call(this);
