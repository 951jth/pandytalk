import dayjs from 'dayjs'
import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import DefaultProfile from '../components/common/DefaultProfile'
import InputForm from '../components/description/InputForm'
import COLORS from '../constants/color'
import {authority} from '../constants/korean'
import {useAppSelector} from '../store/hooks'

export default function ProfileScreen(): React.JSX.Element {
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const [formValues, setFormValues] = useState<object | null>()

  const formItems = [
    {label: '닉네임', key: 'nickname'},
    {label: '이메일', key: 'email', fixed: true},
    {
      label: '권한',
      contents: user?.authority ? authority?.[user?.authority] : '-',
    },
    {
      label: '최근 접속일',
      contents: dayjs(Number(user?.lastSeen))?.format('YYYY-MM-DD hh:mm:ss'),
    },
    {label: '게스트 여부', contents: user?.isGuest ? 'Y' : 'N'},
  ]

  useEffect(() => {
    console.log(user)
    setFormValues(user as object)
  }, [user])

  return (
    <View style={styles.container}>
      <View style={styles.contents}>
        <InputForm
          items={formItems}
          initialData={formValues}
          editable={true}
          buttonLabel="프로필 "
          topElement={
            <View style={styles.profileWrap}>
              <DefaultProfile />
            </View>
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // paddingVertical: 20,
    // paddingHorizontal: 16,
    // backgroundColor: COLORS.background,
  },
  contents: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: COLORS.background,
    // padding: 16,
    // 그림자 스타일 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
})
