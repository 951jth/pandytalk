import React, {useState} from 'react'
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import {IconButton} from 'react-native-paper'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import GuestGroup from '../components/card/GuestGroup'
import EmptyData from '../components/common/EmptyData'
import GroupModalForm from '../components/modal/GroupFormModal'
import COLORS from '../constants/color'
import {useAllGroups} from '../hooks/queries/useGroupQuery'
import type {Group} from '../types/group'

type modalProps = {
  open: boolean
  record: Group | null
}

export default function GroupManageScreen() {
  const [groupModalProps, setGroupModalProps] = useState<modalProps>({
    open: false,
    record: null,
  })
  const {data: groups = [], isLoading, refetch} = useAllGroups()
  const insets = useSafeAreaInsets()

  return (
    <>
      <SafeAreaView
        style={styles.container}
        edges={['right', 'left', 'bottom']}>
        <TouchableOpacity
          style={[styles.bottomRightButton, {bottom: insets.bottom + 16}]}
          onPress={() => setGroupModalProps({open: true, record: null})}>
          <IconButton icon="plus" iconColor="#FFF" />
        </TouchableOpacity>
        <FlatList
          data={groups}
          keyExtractor={item => item.uid}
          style={{flexGrow: 1}}
          renderItem={({item}) => (
            <GuestGroup
              item={item}
              onPress={item => {
                setGroupModalProps({open: true, record: item})
              }}
            />
          )}
          // onEndReached={() => {
          //   if (hasNextPage) fetchNextPage()
          // }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 12,
              }}>
              <EmptyData text={`아직 그룹이 없네요.`} />
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        />
      </SafeAreaView>
      <GroupModalForm
        open={groupModalProps?.open}
        onClose={() => setGroupModalProps({open: false, record: null})}
        record={groupModalProps?.record}
        onRefresh={refetch}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    position: 'relative',
    flex: 1,
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bottomRightButton: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFF',
    zIndex: 10,
    // display: 'inline-flex',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    flexGrow: 1,
  },
})
