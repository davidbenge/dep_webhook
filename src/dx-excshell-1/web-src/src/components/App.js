/* 
* <license header>
*/

import React, { useEffect, useState } from 'react'
import { Provider, defaultTheme, Grid, View, Heading, Flex, ActionButton, Item, Text, useListData } from '@adobe/react-spectrum'
import {ListView} from '@react-spectrum/list'
import ErrorBoundary from 'react-error-boundary'
import { PayloadList } from './PayloadList'
import Button from '@spectrum-icons/workflow/Button'
import LearnerSelect from './LearnerSelect'
import {useAsyncList} from '@react-stately/data';

function App (props) {
  const [learnerId, setLearnerId] = useState()
  const [loglist,setLoglist] = useState([])
  const [selectedWebhookCall, setSelectedWebhookCall] = useState(null)
  const [displayedWebhookCall, setDisplayedWebhookCall] = useState()
  const [connectionButtonText, setConnectionButtonText] = useState("")
  const [socketConnectionStatus, setSocketConnectionStatus] = useState(false)
  const apiKey = 'VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV'
  let piesocket = undefined
  const cluster = "demo"
  console.log('runtime object:', props.runtime)
  console.log('ims object:', props.ims)
  console.log('excShell', props.excShell)

  let webhookCallsList = useListData({
    initialItems: [],
    getKey: item => item["call-time"]
  });

  const handleHookCallSelectionChange = (keys) => {
    console.log('handleHookCallSelectionChange', keys['currentKey'])
    setSelectedWebhookCall(keys['currentKey'])
    setDisplayedWebhookCall(webhookCallsList.getItem(selectedWebhookCall))
    console.log('selectedWebhookCall', selectedWebhookCall)
    console.log('displayedWebhookCall', displayedWebhookCall)
  }

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', ({ imsOrg, imsToken, locale }) => {
    console.log('configuration change', { imsOrg, imsToken, locale })
  })
  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  const handleLearnerInputChange = (plearnerId) => {

    console.log('piesocket.readyState',piesocket?.readyState)

    //Toggle the connection
    if(socketConnectionStatus) {
      console.log('disconnecting')
      //piesocket.close(1000, "Work complete")
      webhookCallsList.remove()
      setSelectedWebhookCall()
      setDisplayedWebhookCall()
      setConnectionButtonText("connect")
      if(typeof piesocket !== 'undefined') {
        piesocket.close(1000, "Work complete")
      }else{
        setSocketConnectionStatus(false)
      }
    }else{
      setConnectionButtonText("disconnect")
      console.log(`in payload list handleLearnerInputChange ${plearnerId}`);

      if(typeof plearnerId !== 'undefined') {
        console.log(`in payload list setting learner id ${plearnerId}`);
        //learnerId = plearnerId;
        setLearnerId(plearnerId);
        piesocket = new WebSocket(`wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);

        piesocket.onmessage = function(message) {
          if(!socketConnectionStatus){
            piesocket.close(1000, "Work complete")
          }
          const data = JSON.parse(message.data);
          data['call-time'] = (data['call-time']*1000);
          webhookCallsList.append(data.event);
          console.log(`Socket incoming message: ${message.data}`);
        }

        piesocket.onclose = function(event) {
          console.log(`closing socket: ${event}`)
          setSocketConnectionStatus(false)
          setConnectionButtonText("connect")
        }

        piesocket.onopen = () => {
          console.log(`connected to websocket wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);
          setSocketConnectionStatus(true)
          setConnectionButtonText("disconnect")
        }
      }else{
        console.error(`in handleLearnerInputChange and learner object is undefined`);
      }
    }
  }

  return (
    <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
      <Provider theme={defaultTheme} colorScheme={`light`}>
      <Grid
        areas={[
          'header header',
          'sidebar content'
        ]}
        columns={['2fr', '2fr']}
        rows={['size-1000', 'auto']}
        gap="size-100">
        <View gridArea="header">
          <Flex direction="column" justifyContent="center" alignItems="center">
            <Heading level={1}>Webhook Test Viewer</Heading>
          </Flex>
        </View>
        <View gridArea="sidebar">
          <Grid
          areas={[
            'connectBar connectBar',
            'headerBarLeft headerBarRight',
            'resultList resultList'
          ]}
          columns={['2fr', '2fr']}
          rows={['size-500','size-500', 'auto']}
          height="size-6000"
          gap="size-0">
            <View gridArea="connectBar" padding="size-50">
              <LearnerSelect onSelectChange={handleLearnerInputChange} connectionStatusText={connectionButtonText} {...props}></LearnerSelect>
            </View>

            <View gridArea="headerBarLeft" padding="size-150">
              <Flex direction="column" justifyContent="center" alignItems="start">
                <Heading level={3} margin="0">All Requests</Heading>
              </Flex>
            </View>
            <View gridArea="headerBarRight" padding="size-20">
              <Flex direction="column" justifyContent="center" alignItems="end">
                <ActionButton width="size-1000">Clear</ActionButton>
              </Flex>
            </View>

            <View gridArea="resultList">
              <Flex direction="column" height="100%">
                <ListView
                  selectionMode="single"
                  selectionStyle="highlight"
                  aria-label="Websocket post events"
                  items={webhookCallsList.items}
                  onAction={(key) => alert(`Triggering action on item ${key}`)}
                  onSelectionChange={handleHookCallSelectionChange}
                >
                {(item) => (
                  <Item key={item.key}>
                    <View>
                    <Text>{new Date((item['call-time']*1000)).toLocaleString("en-US")}</Text>
                    </View>
                  </Item>
                )}
                </ListView>               
              </Flex>
            </View>
          </Grid>
        </View>
        <View gridArea="content">
          {displayedWebhookCall ? (
            <Flex direction="column" marginStart="size-500" marginEnd="size-500" >
              <View backgroundColor="gray-50">
                <pre>
                  <Text>{displayedWebhookCall ? (JSON.stringify(displayedWebhookCall, null, 2)) : ''}</Text>
                </pre>
              </View>
            </Flex>
          ) : ''}
        </View>
      </Grid>
      </Provider>
    </ErrorBoundary>
  )

  // Methods
  /*
  <PayloadList runtime={props.runtime} ims={props.ims} actionCallHeaders={props.actionCallHeaders}/>
  */

  // error handler on UI rendering failure
  function onError (e, componentStack) { }

  // component to show if UI fails rendering
  function fallbackComponent ({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>
          Something went wrong :(
        </h1>
        <pre>{componentStack + '\n' + error.message}</pre>
      </React.Fragment>
    )
  }
}

export default App
