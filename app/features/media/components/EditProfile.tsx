import {fileService} from '@app/features/media/service/fileService'
import COLORS from '@app/shared/constants/color'
import DefaultProfile from '@app/shared/ui/common/DefaultProfile'
import ImageViewer from '@app/shared/ui/common/ImageViewer'
import {
  requestPhotoPermission,
  showPermissionBlockedAlert,
} from '@app/shared/utils/permission'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  type ForwardedRef,
} from 'react'
import {Alert, StyleSheet, View} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {ActivityIndicator, FAB} from 'react-native-paper'

interface propTypes {
  // previewUrl: string | null
  // setPreviewUrl: (value: string) => void
  defaultUrl: string | null | undefined
  edit?: boolean
  boxSize?: number
  iconSize?: number
}

export interface ProfileInputRef {
  upload: () => Promise<string | null>
  getImage: () => string | null | undefined
  setImage: (value: string) => void
  onReset: () => void
}

//ref로 받도록 수정함
const EditProfile = forwardRef(function EditProfile(
  {defaultUrl, edit, boxSize = 120, iconSize = 90}: propTypes,
  ref: ForwardedRef<ProfileInputRef>,
) {
  const [previewUrl, setPreviewUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState<boolean>(false)
  const upload = useCallback(async (): Promise<string | null> => {
    try {
      if (!previewUrl) return null
      const newPhotoURL = await fileService.uploadFile({
        localUri: previewUrl,
        rootName: 'profiles',
      })
      return newPhotoURL
    } catch {
      return null
    }
  }, [previewUrl])

  useImperativeHandle(
    ref,
    () => ({
      upload,
      getImage: () => previewUrl,
      setImage: (url: string) => setPreviewUrl(url),
      onReset: () => setPreviewUrl(defaultUrl),
    }),
    [defaultUrl, previewUrl, upload],
  )

  const pickImage = async () => {
    try {
      setLoading(true)
      const hasPermission = await requestPhotoPermission()
      console.log('hasPermission', hasPermission)

      if (hasPermission?.status === 'BLOCKED')
        return showPermissionBlockedAlert({})
      if (!hasPermission?.ok)
        return Alert.alert('권한 확인', hasPermission?.reason)
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      })

      // 유저가 취소했거나 uri가 없을 경우 무시
      if (result.didCancel || result.errorCode) return
      const asset = result.assets?.[0]
      if (!asset?.uri) {
        console.warn('선택된 이미지가 없습니다.')
        return
      }

      // 결과 URI 설정
      setPreviewUrl(asset.uri)
    } catch (error) {
      console.error('이미지 선택 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.profile}>
      {previewUrl ? (
        <View
          key={previewUrl}
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: boxSize / 2,
            overflow: 'hidden', // ✅ 추가
          }}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <ImageViewer
              images={[{uri: previewUrl}]}
              imageProps={{
                resizeMode: 'cover',
                style: {
                  width: boxSize,
                  height: boxSize,
                  borderRadius: boxSize / 2,
                },
              }}
            />
          )}
        </View>
      ) : (
        <DefaultProfile boxSize={boxSize} iconSize={iconSize} />
      )}
      {edit && (
        <FAB
          icon="camera"
          style={styles.editButton}
          onPress={pickImage}
          size="small"
          color="#000"
          customSize={40}
        />
      )}
    </View>
  )
})

export default EditProfile

const styles = StyleSheet.create({
  profile: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // ✅ 그림자 (Android)
    elevation: 5,
    // ✅ 배경색이 있어야 그림자 표시됨 (특히 iOS)
    backgroundColor: '#FFF',
    // ✅ 둥근 외곽이 유지되도록
    borderRadius: 100,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 100,
    // ✅ 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // ✅ 그림자 (Android)
    elevation: 5,
  },
})
