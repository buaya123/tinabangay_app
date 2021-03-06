import React, { Component } from 'react';
import Style from './Style.js';
import { View, Image, TouchableHighlight, Text, ScrollView, FlatList, TextInput, Picker, Platform} from 'react-native';
import { Routes, Color, Helper, BasicStyles } from 'common';
import { Spinner, Empty, ImageUpload, GooglePlacesAutoComplete, DateTime } from 'components';
import Api from 'services/api/index.js';
import Currency from 'services/Currency.js';
import { connect } from 'react-redux';
import Config from 'src/config.js';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle, faMapMarker } from '@fortawesome/free-solid-svg-icons';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import DisplayRides from './Display.js';
const height = Math.round(Dimensions.get('window').height);
class Ride extends Component{
  constructor(props){
    super(props);
    this.state = {
      isLoading: false,
      newDataFlag: false,
      fromDate: null,
      toDate: null,
      from: null,
      to: null,
      data: null,
      selected: null,
      errorMessage: null,
      locationFlag: 'from',
      dateFlag: null,
      code: null,
      type: null
    }
  }

  componentDidMount(){
    this.retrieve()
  }

  retrieve = () => {
    const { user } = this.props.state;
    if(user === null){
      return
    }
    let parameter = {
      condition: [{
        value: user.id,
        clause: '=',
        column: 'account_id'
      }],
      sort: {
        created_at: 'desc'
      }
    }
    this.setState({
      isLoading: true, 
      showDatePicker: false,
      showTimePicker: false
    })
    Api.request(Routes.ridesRetrieve, parameter, response => {
      this.setState({isLoading: false})
      if(response.data.length > 0){
        this.setState({data: response.data})
      }else{
        this.setState({data: null})
      }
    }, error => {
      this.setState({isLoading: false})
      console.log(error)
    });
  }

  submit = () => {
    const { user } = this.props.state;
    const {from, to, fromDate, toDate, type, code } = this.state;
    if(user == null){
      this.setState({errorMessage: 'Invalid Account.'})
      return
    }
    if(from == null || to == null){
      this.setState({errorMessage: 'Locations are required.'})
      return
    }
    if(fromDate == null || toDate == null){
      this.setState({errorMessage: 'Dates are required.'})
      return
    }
    if(type == null){
      this.setState({errorMessage: 'Type is required.'})
      return
    }
    this.setState({errorMessage: null})
    let parameter = {
      account_id: user.id,
      from: from,
      to: to,
      from_date_time: fromDate,
      to_date_time: toDate,
      payload: 'manual',
      type: type,
      code: code
    }
    this.setState({isLoading: true})
    console.log(parameter)
    Api.request(Routes.ridesCreate, parameter, response => {
      console.log(response)
      this.setState({isLoading: false})
      if(response.data > 0){
        this.setState({
          newDataFlag: false,
          fromDatePicker: false,
          fromDateLabel: null,
          fromDateFlag: false,
          fromDate: new Date(),
          toDatePicker: false,
          toDateLabel: null,
          toTimeFlag: false,
          toDate: new Date(),
          from: null,
          to: null,
          selected: null,
          errorMessage: null,
          locationFlag: 'from'
        })
        this.retrieve()
      }
    }, error => {
      console.log(error)
      this.setState({isLoading: false})
    });
    // this.setState({newPlaceFlag: false})
    console.log("hello")
  }

  manageLocation = (location) => {
    const { locationFlag } = this.state;
    if(locationFlag == 'from'){
      this.setState({
        from: location ? location.route + ', ' + location.locality + ', ' + location.country : null
      })
    }else{
      this.setState({
        to: location ? location.route + ', ' + location.locality + ', ' + location.country : null
      })
    }
  }

  _newData = () => {
    const types = Helper.transportationTypes.map((item, index) => {
      return {
        label: item.title,
        value: item.value
      };
    })
    return (
      <View>
        {
          this.state.errorMessage != null && (
            <View>
              <Text style={{
                color: Color.danger,
                paddingTop: 10,
                paddingBottom: 10,
                textAlign: 'center'
              }}>{this.state.errorMessage}</Text>
            </View>
          )
        }
        <View style={{
          marginTop: 10
        }}>
          <Text>Select Type</Text>
          {
            Platform.OS == 'android' && (
              <Picker selectedValue={this.state.type}
              onValueChange={(type) => this.setState({type})}
              style={BasicStyles.pickerStyleCreate}
              >
                {
                  Helper.transportationTypes.map((item, index) => {
                    return (
                      <Picker.Item
                      key={index}
                      label={item.title} 
                      value={item.value}/>
                    );
                  })
                }
              </Picker>
            )
          }
          {
            Platform.OS == 'ios' && (
              <RNPickerSelect
                onValueChange={(type) => this.setState({type})}
                items={types}
                style={BasicStyles.pickerStyleIOSNoMargin}
                placeholder={{
                  label: 'Click to select',
                  value: null,
                  color: Color.primary
                }}
                />
            )
          }
        </View>
        <View>
          <Text style={{
            paddingTop: 10
          }}>Code(Optional)</Text>
          <TextInput
            style={BasicStyles.formControlCreate}
            onChangeText={(code) => this.setState({code})}
            value={this.state.code}
            placeholder={'Plate Number, Flight Number, Jeepney Code ...'}
          />
        </View>
        <View style={{
          position: 'relative',
          backgroundColor: Color.white,
          zIndex: 2
        }}>
          <Text style={{
            paddingTop: 10
          }}>From</Text>
          <GooglePlacesAutoComplete 
            onFinish={(from) => this.manageLocation(from)}
            placeholder={'Start typing location'}
            onChange={() => this.setState({
              locationFlag: 'from'
            })}
          />
        </View>
        <View>
          <Text style={{
            paddingTop: 10
          }}>From Date</Text>
          <DateTime
            type={'datetime'}
            placeholder={'Select Date'}
            onFinish={(date) => {
              this.setState({
                fromDate: date.date + ' ' + date.time
              })
            }}
            style={{
              marginTop: 5
            }}
          />
        </View>
        <View style={{
          position: 'relative',
          backgroundColor: Color.white,
          zIndex: 1,
          marginTop: 20
        }}>
          <Text style={{
            paddingTop: 10
          }}>To</Text>
          <GooglePlacesAutoComplete 
            onFinish={(to) => this.manageLocation(to)}
            placeholder={'Start typing location'}
            onChange={() => this.setState({
              locationFlag: 'to'
            })}
          />
        </View>
        <View>
          <Text style={{
            paddingTop: 10
          }}>To Date</Text>
          <DateTime
            type={'datetime'}
            placeholder={'Select Date'}
            onFinish={(date) => {
              this.setState({
                toDate: date.date + ' ' + date.time
              })
            }}
            style={{
              marginTop: 5
            }}
          />
        </View>

        <View>
          <TouchableHighlight style={{
                height: 50,
                backgroundColor: Color.primary,
                width: '100%',
                marginBottom: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 5,
                marginTop: 20
              }}
              onPress={() => {this.submit()}}
              underlayColor={Color.gray}
                >
              <Text style={{
                color: Color.white,
                textAlign: 'center',
              }}>Submit</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

  render() {
    const { user } = this.props.state;
    const { isLoading, newDataFlag, data } = this.state;
    return (
      <ScrollView
        style={Style.ScrollView}
        onScroll={(event) => {
          if(event.nativeEvent.contentOffset.y <= 0) {
            if(this.state.isLoading == false){
              this.retrieve()
            }
          }
        }}
        >
        {/*
        <View style={{
          borderRadius: 5,
          backgroundColor: Color.danger,
          paddingTop: 10,
          paddingLeft: 10,
          paddingRight: 10,
          paddingBottom: 10
        }}>
          <Text style={{
            color: Color.white
          }}>
            Hi {user != null ? user.username : ''}! We would like to ask your help to input your transportation history that you have been on board for the past months. Please, be honest and help us fight COVID-19. Don't worry your location is not viewable from other users.
          </Text>
        </View>*/}
        {isLoading ? <Spinner mode="overlay"/> : null }
        {/*
          newDataFlag == false && (
            <TouchableHighlight
              style={[BasicStyles.btn, {
                backgroundColor: Color.primary,
                width: '100%',
                marginTop: 20
              }]}
              onPress={() => {
                this.setState({newDataFlag: true})
              }}
              
            >
              <Text style={{
                color: Color.white
              }}>Add previous rides</Text>
            </TouchableHighlight>
          )*/
        }
        {
          newDataFlag == true && (
            this._newData()
          )
        }
        {
          data == null && (
            <Empty /> 
          )
        }
        {
          data !== null && (
            <DisplayRides data={data}/>
          )
        }
      </ScrollView>
    );
  }
}
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    setPreviousRoute: (previousRoute) => dispatch(actions.setPreviousRoute(previousRoute))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Ride);
