import React, {useEffect, useState, useMemo} from 'react';
import {
  Text,
  View,
  NativeModules,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';

// Khai báo Native module
const rfidModule = NativeModules.RfidChainwayR6;

function App(props: any) {
  const [devicesConnect, setDevicesConnect] = useState('');
  const [devicesList, setDevicesList] = useState([]);
  const [listRFID, setListRFID] = useState([]);
  const [clearFfid, setClearRfid] = useState(false);
  const [powerRFID, setPowerRFID] = useState('5')
  const [rfidTagName, setRFIDTagName] = useState('')

  //Thêm event listener khi read rfid
  //Khi clear tạo 1 state refresh lại list rfid để listener receive state list
  useEffect(() => {
    DeviceEventEmitter.removeAllListeners();
    DeviceEventEmitter.addListener('ScanBLEListenner', (res: any) => {
      devicesList.push(res);
      devicesList.sort((a, b) => parseFloat(b.rssi) - parseFloat(a.rssi))
      setDevicesList([...devicesList]);
    });
    DeviceEventEmitter.addListener('ReadRFIDListenner', (res: any) => {
      listRFID.push(res);
      setListRFID([...listRFID]);
    });
  }, [clearFfid]);

  // connect sled reader khi didmount
  useEffect(() => {
    rfidModule.connectAddress('EA:E2:7C:B8:2E:2F').then(res => {
    // rfidModule.connectAddress('C3:59:65:FB:D6:AC').then(res => {
      setDevicesConnect(res);
    });
  }, []);

  function renderItemBLE({item, index}) {
    return (
      <TouchableOpacity
        style={{
          width: '100%',
          height: 30,
          backgroundColor: '#FFFFFF',
          marginHorizontal: 10,
          marginBottom: 3,
        }}
        onPress={() => {
          rfidModule.stopScanBLE();
          rfidModule.connectAddress(item.address_device).then((res: any) => {
            setDevicesConnect(res);
          });
        }}>
        <Text>{item.address_device}</Text>
      </TouchableOpacity>
    );
  }
  function renderItemRFID({item, index}) {
    return (
      <TouchableOpacity
        style={{
          width: '100%',
          height: 30,
          backgroundColor: '#FFFFFF',
          marginHorizontal: 10,
          marginBottom: 3,
        }}>
        <Text>{`${index + 1}. ${item.rfid_tag}`}</Text>
      </TouchableOpacity>
    );
  }

  function renderPower() {
    return (
      <View>
        <TextInput
          style={styles.input}
          onChangeText={text => setPowerRFID(text)}
          value={powerRFID}
          placeholder="Set power RFID..."
          keyboardType="numeric"
        />
        <TouchableOpacity
          onPress={() => {
            rfidModule.setPower(Number(powerRFID))
          }}
          style={{
            width: '100%',
            height: 30,
            backgroundColor: '#A71',
            marginHorizontal: 10,
            marginBottom: 3,
          }}>
          <Text>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    );
  }
  function renderRfidTagName() {
    return (
      <View>
        <TextInput
          style={styles.input}
          onChangeText={text => setRFIDTagName(text)}
          value={rfidTagName}
          placeholder="Search RFID..."
          // keyboardType="numeric"
        />
        <TouchableOpacity
          onPress={() => {
            // rfidModule.setPower(Number(powerRFID))
            rfidModule.startScanRFIDWithRfid(String(rfidTagName));
          }}
          style={{
            width: '100%',
            height: 30,
            backgroundColor: 'gray',
            marginHorizontal: 10,
            padding: 10,
            marginBottom: 3,
          }}>
          <Text style = {{color: 'white'}}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderBTEvent(title: string, color: string, callback: { (): void; (): void; (): void; (): any; (): any; (): any; }) {
    return (
      <TouchableOpacity
        style={{
          marginTop: 30,
          backgroundColor: color,
          width: '20%',
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => callback()}>
        <Text style={{color: 'white'}}>{title}</Text>
      </TouchableOpacity>
    );
  }

  const renderListDevices = useMemo(() => {
    return (
      <FlatList
        style={{flex: 1, width: '100%', marginTop: 20}}
        data={devicesList}
        renderItem={renderItemBLE}
        keyExtractor={(index) => `device${index}`}
      />
    );
  }, [devicesList]);

  const renderListRFID = useMemo(() => {
    return (
      <FlatList
        style={{flex: 1, width: '100%', marginTop: 20}}
        data={listRFID}
        keyExtractor={(item, index) => `rfid${index}`}
        renderItem={renderItemRFID}
      />
    );
  }, [listRFID]);

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Text style={{marginTop: 20, fontWeight: '600'}}>
        {devicesConnect ? `Connect: ${devicesConnect}` : ''}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-around',
        }}>
        {renderBTEvent('Scan', 'gray', () => {
          {
            setDevicesList([]);
            setClearRfid(!clearFfid);
            rfidModule.ScanBLE();
          }
        })}
        {renderBTEvent('Stop', 'red', () => {
          {
            rfidModule.stopScanBLE()
          }
        })}
        {renderBTEvent('Start', 'blue', () => {
          rfidModule.startScanRFID();
        })}
        {renderBTEvent('Stop', 'red', () => rfidModule.stop())}
        {renderBTEvent('Clear', 'green', () =>
          rfidModule.clearData().then((res: any) => {
            if (res) {
              setListRFID([]);
              setClearRfid(!clearFfid);
            }
          }),
        )}
      </View>
      {renderRfidTagName()}
      {renderListDevices}
      {renderListRFID}
      {renderPower()}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    width: '100%',
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
