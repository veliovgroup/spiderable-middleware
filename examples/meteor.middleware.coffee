# meteor add webapp
# meteor add ostrio:spiderable-middleware

`import Spiderable from 'meteor/ostrio:spiderable-middleware';`

spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'APIUser:APIPass'

# meteor@>=3
WebApp.connectHandlers.use spiderable.handler.bind spiderable

# meteor@<3
# WebApp.connectHandlers.use spiderable
