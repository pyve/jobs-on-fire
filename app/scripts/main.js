/*global Backbone, _, $, Firebase*/

'use strict';

$(function() {
  var jobs;

  var DATABASE = 'jobs-on-fire';

  var firebase = window.firebase = new Firebase('https://' + DATABASE + '.firebaseio.com/');

  firebase.onAuth(function(authData) {
    if (authData) {
      $('.logout').removeClass('hide');
    } else {
      $('.logout').addClass('hide');
    }
  });

  var escapeObj = function(obj) {
    return _.reduce(_.map(obj, function(value, key) {
      var ret = {};
      if (_.isString(value)) {
        ret[key] = _.escape(value);
      } else {
        ret[key] = value;
      }
      return ret;
    }), function(memo, item) {
      return _.extend(memo, item);
    }, {});
  };

  /* Backbone forms customization */
  Backbone.Form.template = _.template('<form class="form-horizontal" role="form" data-fieldsets></form>');
  Backbone.Form.Fieldset.template = _.template('<fieldset data-fields><% if (legend) { %><legend><%= legend %></legend><% } %></fieldset>');
  Backbone.Form.Field.template = _.template('<div class="form-group field-<%= key %>"><label class="col-sm-2 control-label" for="<%= editorId %>"><%= title %></label><div class="col-sm-10"><span data-editor></span><p class="help-block" data-error></p><p class="help-block"><%= help %></p></div></div>');
  Backbone.Form.NestedField.template = _.template('<div class="field-<%= key %>"><div title="<%= title %>" class="input-xlarge"><span data-editor></span><div class="help-inline" data-error></div></div><div class="help-block"><%= help %></div></div>');
  Backbone.Form.editors.Base.prototype.className = 'form-control';
  Backbone.Form.editors.Radio.prototype.className = 'radio';
  Backbone.Form.editors.Checkbox.prototype.className = 'checkbox';
  Backbone.Form.editors.Date.monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  Backbone.Form.Field.errorClassName = 'has-error';
  Backbone.Form.validators.errMessages.required = 'Obligatorio';
  Backbone.Form.validators.errMessages.email = 'Debe indicar un correo electrónico válido';
  Backbone.Form.validators.errMessages.url = 'El enlace debe ser una URL válida';
  /* End of Backbone Forms customization */

  var JobSchema = {
    title: {
      title: 'Título de la Oferta',
      type: 'Text',
      validators: ['required']
    },
    expires: {
      title: 'Fecha de Expiración',
      type: 'Date',
      yearStart: new Date().getFullYear(),
      yearEnd: new Date().getFullYear() + 1,
      validators: [
        'required',
        function(value) {
          if (new Date(value).valueOf() < Date.now()) {
            return {
              type: 'expires',
              message: 'La fecha de expiración debe estar en el futuro'
            };
          } else {
            return null;
          }
        }
      ]
    },
    location: {
      title: 'Ubicación',
      type: 'Text',
      validators: [
        function(value, formValues) {
          if (!formValues.remote && !value) {
            return {
              type: 'location',
              message: 'Debes indicar una ubicación si el empleo no es remoto'
            };
          } else {
            return null;
          }
        }
      ]
    },
    remote: {
      title: 'Remoto?',
      type: 'Checkbox'
    },
    workingTime: {
      title: 'Horario de Trabajo',
      type: 'Radio',
      options: [
        'A convenir',
        'Medio Tiempo',
        'Tiempo Completo'
      ]
    },
    description: {
      title: 'Descripción',
      type: 'TextArea',
      validators: [
        'required',
        function(value) {
          if (value.length < 140) {
            return {
              type: 'description',
              message: 'La descripción es muy corta. Debe ser de 140 caracteres o más.'
            };
          } else {
            return null;
          }
        }
      ]
    },
    publisher: {
      title: 'Publicado por',
      type: 'Text',
      validators: ['required']
    },
    email: {
      title: 'Correo de contacto',
      type: 'Text',
      dataType: 'email',
      validators: [
        'email',
        function(value, formValues) {
          if (!value && !formValues.url) {
            return {
              type: 'email',
              message: 'Es necesario un correo electrónico o una URL de aplicación'
            };
          } else {
            return null;
          }
        }
      ]
    },
    url: {
      title: 'URL de aplicación',
      type: 'Text',
      dataType: 'url',
      validators: [
        'url',
        function(value, formValues) {
          if (!value && !formValues.email) {
            return {
              type: 'url',
              message: 'Es necesario un correo electrónico o una URL de aplicación'
            };
          } else {
            return null;
          }
        }
      ]
    }
  };

  var Job = Backbone.Model.extend({
    expired: function() {
      var exp = this.get('expires');
      if (exp && ((new Date(exp).valueOf() + 86400000) <= Date.now())) {
        return true;
      } else {
        return false;
      }
    },
    dateToString: function(date) {
      return _.isFunction(Date.toLocaleString) ? new Date(date).toLocaleString() : new Date(date).toString();
    },
    dateToDateString: function(date) {
      return _.isFunction(new Date().toLocaleDateString) ? new Date(date).toLocaleDateString() : new Date(date).toDateString();
    }
  });

  var Jobs = Backbone.Firebase.Collection.extend({
    model: Job,
    firebase: firebase.child('jobs')
  });

  var JobView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#job_template').text()),
    events: {
      'click .job-delete': 'remove'
    },
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },
    render: function() {
      var job = escapeObj(this.model.toJSON());
      this.$el.html(this.template(job));
      return this;
    },
    remove: function(evt) {
      evt.preventDefault();
      // TODO: we should soft delete here, setting deletedBy to the current user id
      // for moderation and auditing
      jobs.remove(this.model);
    }
  });


  var LoginOrRegisterView = Backbone.View.extend({
    el: $('#login_or_register_body'),
    events: {
      'click #login_or_register_fb': 'fbLogin',
      'click #login_or_register_tw': 'twLogin',
      'click #login_or_register_gh': 'ghLogin',
      'click #login_or_register_go': 'goLogin'
    },
    initialize: function() {
      this.users = firebase.child('users');
    },
    genericLogin: function(err, authData) {
      if (!err) {
        this.users.child(authData.uid).set(authData);
        $('#login_or_register_modal').modal('hide');
      } else {
        this.$el.prepend('<p class="text-danger">No se pudo ingresar</p>');
        firebase.child('errors').push(err);
      }
    },
    fbLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('facebook', _.bind(this.genericLogin, this));
    },
    twLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('twitter', _.bind(this.genericLogin, this));
    },
    ghLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('github', _.bind(this.genericLogin, this));
    },
    goLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('google', _.bind(this.genericLogin, this));
    }
  });

  var AddJobView = Backbone.View.extend({
    el: $('#add_job_content'),
    events: {
      'click #add_job_button': 'addJob'
    },
    initialize: function(pars) {
      this.jobs = pars.jobs;
    },
    render: function() {
      this.form = new Backbone.Form({
        schema: JobSchema,
        data: {
          expires: Date.now().valueOf() + 1296015000, // now plus 15 days and 1 sec
          remote: false,
          workingTime: 'A convenir'
        }
      });
      this.$('.add-job-form').html(this.form.render().el);
    },
    addJob: function() {
      var jobData, newJob, user, now;
      if (!this.form.validate()) { // This means it's valid, meh.
        jobData = escapeObj(this.form.getValue());
        user = this.jobs.firebase.getAuth();
        now = Date.now().valueOf();
        jobData.expires = jobData.expires.valueOf();
        newJob = _.defaults(jobData, {
          userId: user ? user.uid : '',
          posted: now,
          updated: now,
          expires: now + 1296015000
        });
        this.jobs.add(newJob);
        $('#add_job_modal').modal('hide');
      }
    }
  });


  var JobsView = Backbone.View.extend({
    el: $('#jobs_on_fire'),
    events: {
      'click #add_job': 'addJobDialog',
      'click #logout_link': 'logout'
    },
    initialize: function(pars) {
      this.jobs = pars.jobs;
      this.list = this.$('#jobs .jobs-list');
      this.listenTo(this.jobs, 'add', this.addOne);
      this.listenTo(this.jobs, 'remove', this.removeOne);
    },
    addOne: function(job) {
      var view = new JobView({model: job});
      this.list.append(view.render().el);
    },
    removeOne: function(obj) {
      this.$('#job_' + obj.id).remove();
    },
    addJobDialog: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var authData = this.jobs.firebase.getAuth();
      if (authData) {
        new AddJobView({jobs: this.jobs}).render();
        this.$('#add_job_modal').modal();
      } else {
        new LoginOrRegisterView({firebase: this.jobs.firebase}).render();
        this.$('#login_or_register_modal').modal();
      }
    },
    logout: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.jobs.firebase.unauth();
    }
  });

  jobs = new Jobs();
  new JobsView({jobs: jobs});
});
