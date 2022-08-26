/* 
* <license header>
*/
import React, { useState, useEffect } from 'react';
import '@spectrum-css/typography';
import '@spectrum-css/table';
import {
  Flex,
  View,
  TextField,
  Text,
  Button,
} from '@adobe/react-spectrum';
import Cookies from 'js-cookie';
import actions from '../config';

function LearnerSelect ({onSelectChange,connectionStatusText="Connect",...props}) {
  const [selectedLearnerId, setLearnerId] = useState();

  const handleInputChange = (sle) => {
    Cookies.set('selectedLearner', sle);
    setLearnerId(sle);
  };

  const sendLearnerChange = () => {
    onSelectChange(selectedLearnerId);
  }

  useEffect(() => {
  }, []);

  return (
    <Flex direction="row" height="size-800" gap="size-100" justifyContent="center" alignContent="center">
      <View width="size-8000" UNSAFE_className="webhook-url"><Text>{actions['webhook']}/</Text></View>
      <View width="size-2500">
        <TextField UNSAFE_className="webhook-url-channel" onChange={handleInputChange} value={selectedLearnerId} aria-label="webhook channel url" />
      </View>
      <View width="size-1200">
        <Button variant="primary" onPress={sendLearnerChange} >{connectionStatusText ? connectionStatusText: 'Connect'}</Button>
      </View>
    </Flex>
  )
}


export default LearnerSelect
