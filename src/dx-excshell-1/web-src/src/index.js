/* 
* <license header>
*/

import 'core-js/stable'
import 'regenerator-runtime/runtime'

window.React = require('react')
import ReactDOM from 'react-dom'

import App from './components/App'
import './index.css'

let runningInExcShell = false
/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
try {
  /* **here you can mock the exc runtime and ims objects** */
  const mockRuntime = { on: () => {} }
  const mockIms = {}

  // render the actual react application and pass along the runtime object to make it available to the App
  ReactDOM.render(
    <App runtime={mockRuntime} ims={mockIms} excShell={runningInExcShell}/>,
    document.getElementById('root')
  )
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  // fallback mode, run the application without the Experience Cloud Runtime
  bootstrapRaw()
}