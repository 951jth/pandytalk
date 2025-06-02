import React from 'react'
import {StyleSheet} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {IconButton} from 'react-native-paper'
import {requestPhotoPermission} from '../../utils/permission'
interface propTypes {
  iconSize?: number
}

export default function UploadButton({iconSize = 25}) {
  const pickFile = async () => {
    try {
      const hasPermission = await requestPhotoPermission()
      if (!hasPermission) return
      const result = await launchImageLibrary({mediaType: 'photo'})
      if (result.didCancel || !result.assets?.[0]?.uri) return
      //   setPreviewUrl(result.assets[0].uri!)
    } catch (e) {
      console.log('이미지피커 오류: ', e)
    }
  }

  return (
    <>
      <IconButton
        icon={'plus'}
        size={iconSize}
        style={[styles.iconButton, {width: iconSize, height: iconSize}]}
        contentStyle={{width: iconSize, height: iconSize}}
        onPress={pickFile}
      />
    </>
  )
}

const styles = StyleSheet.create({
  uploadIcon: {
    backgroundColor: '#FFF',
    padding: 0,
    // borderRadius: 20,
  },
  iconButton: {
    // backgroundColor: COLORS.outerColor,
    margin: 0,
    padding: 0,
  },
})
