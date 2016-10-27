# meteor add ostrio:spiderable-middleware

WebApp.connectHandlers.use new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'APIUser:APIPass'