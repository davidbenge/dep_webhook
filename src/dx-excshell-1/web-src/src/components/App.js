/* 
* <license header>
*/

import React, { useEffect, useState } from 'react'
import { Provider, defaultTheme, Grid, View, Heading, Flex, ActionButton, Item, Text, useListData } from '@adobe/react-spectrum'
import {ListView} from '@react-spectrum/list'
import ErrorBoundary from 'react-error-boundary'
import LearnerSelect from './LearnerSelect'

function App (props) {
  //const [learnerId, setLearnerId] = useState()
  //const [loglist,setLoglist] = useState([])
  //const [selectedWebhookCall, setSelectedWebhookCall] = useState(null)
  const [displayedWebhookCall, setDisplayedWebhookCall] = useState()
  const [connectionButtonText, setConnectionButtonText] = useState("")
  //const [socketConnectionStatus, setSocketConnectionStatus] = useState(false)
  let learnerId = undefined
  let socketConnectionStatus = false
  let selectedWebhookCall = null 
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
    selectedWebhookCall = keys['currentKey']
    setDisplayedWebhookCall(webhookCallsList.getItem(selectedWebhookCall))
    console.log('selectedWebhookCall', selectedWebhookCall)
    console.log('displayedWebhookCall', displayedWebhookCall)
  }

  //get json value for dot notation path
  const getDescendantProp = (obj, path) => (
    path.split('.').reduce((acc, part) => acc && acc[part], obj)
  );

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', ({ imsOrg, imsToken, locale }) => {
    console.log('configuration change', { imsOrg, imsToken, locale })
  })
  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  const clearWebhookCallList = () =>{
    for(item in webhookCallsList.items){
      console.log('clearWebhookCallList item',webhookCallsList.items[item])
      webhookCallsList.remove(webhookCallsList.items[item].id)
    }
  }

  const clearButtonOnPress = (e) => {
    clearWebhookCallList()
  }

  const handleLearnerInputChange = (plearnerId) => {
    console.log(`in handleLearnerInputChange with socketConnectionStatus = ${socketConnectionStatus}`)
          
    //Toggle the connection
    if(socketConnectionStatus) {
      console.log(`setting socketConnectionStatus to false`)
      //setSocketConnectionStatus(false)
      socketConnectionStatus = false
      setConnectionButtonText("connect")
    }else{
      console.log(`setting socketConnectionStatus to true`)
      //setSocketConnectionStatus(true)
      socketConnectionStatus = true
      setConnectionButtonText("disconnect")
    }

    console.log(`in handleLearnerInputChange post toggle with socketConnectionStatus = ${socketConnectionStatus}`)

    if(typeof plearnerId !== 'undefined' && socketConnectionStatus) {
      console.log(`in payload list setting learner id ${plearnerId}`);
      //learnerId = plearnerId;
      //setLearnerId(plearnerId);
      this.learnerId = plearnerId;
      piesocket = new WebSocket(`wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);
      
      piesocket.onmessage = function(message) {
        if(!socketConnectionStatus){
          console.log(`in onmessage and closing with socketConnectionStatus = ${socketConnectionStatus}`);
          try {
            piesocket.close(1000, "Work complete")
          } catch (error) {}
        }
        const data = JSON.parse(message.data);
        data['call-time'] = (data['call-time']*1000);
        webhookCallsList.append(data.event);
        console.log(`Socket incoming message: ${message.data}`);
      }

      piesocket.onclose = function(event) {
        console.log(`closing socket: ${event}`)
      }

      piesocket.onopen = () => {
        console.log(`connected to websocket wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);
      }
    }else{
      try{
        console.log(`in main else and closing with socketConnectionStatus = ${socketConnectionStatus}`);
        webhookCallsList.remove()
        selectedWebhookCall = null
        selectedWebhookCall = null
        piesocket.close(1000, "Work complete")
      }catch(e){}
      console.error(`in handleLearnerInputChange and learner object is undefined`);
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
                <ActionButton width="size-1000" onPress={clearButtonOnPress}>Clear</ActionButton>
              </Flex>
            </View>

            <View gridArea="resultList">
              <Flex direction="column" height="100%">
                <ListView
                  selectionMode="single"
                  selectionStyle="highlight"
                  aria-label="Websocket post events"
                  items={webhookCallsList.items}
                  //onAction={handleHookCallSelectionChange}
                  onSelectionChange={handleHookCallSelectionChange}
                >
                {(item) => (
                  <Item key={item.key} textValue={item.key}>
                    {new Date((item['call-time']*1000)).toLocaleString("en-US")} {item['query-params'].guid ? `- ${item['query-params'].guid}` : ''} {item['query-params'].GUID ? `- ${item['query-params'].GUID}` : ''} {item['query-params'].namespace ? `- ${item['query-params'].namespace}` : ''} {item['query-params']['custom_path'] ? `- ${getDescendantProp(item,item['query-params']['custom_path'])}` : ''}
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
