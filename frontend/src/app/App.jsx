import './styles/globals.css'
import AppRouter from './providers/router/ui/AppRouter';
import { ServerWakeGate } from './providers/server-wake';

function App() {
  return (
    <ServerWakeGate>
      <AppRouter/>
    </ServerWakeGate>
  )
}

export default App;