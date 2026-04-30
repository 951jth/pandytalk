import {useGroupManageScreen} from '@app/features/group/hooks/useGroupManageScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import GroupManageSkeleton from '@app/shared/ui/skeleton/GroupManageSkeleton'
import React from 'react'
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import {IconButton} from 'react-native-paper'
import EmptyData from '../../../shared/ui/common/EmptyData'
import GroupModalForm from '../components/GroupFormModal'
import GuestGroup from '../components/GuestGroup'

export default function GroupManageScreen() {
  const {
    groups,
    isLoading,
    refetch,
    groupModalProps,
    setGroupModalProps,
  } = useGroupManageScreen()

  if (isLoading && !groups?.length) {
    return (
      <View style={styles.container}>
        <AppHeader title="그룹 관리" />
        <GroupManageSkeleton />
      </View>
    )
  }

  return (
    <>
      <View style={styles.container}>
        <AppHeader title="그룹 관리" />
        {/* 그룹 추가 프리미엄 FAB */}
        <TouchableOpacity
          style={[styles.bottomRightButton]}
          onPress={() => setGroupModalProps({open: true, record: null})}>
          <IconButton icon="plus" iconColor="#FFF" size={30} />
        </TouchableOpacity>

        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          style={{flex: 1}}
          renderItem={({item}) => (
            <GuestGroup
              item={item}
              onPress={selectedGroup => {
                setGroupModalProps({open: true, record: selectedGroup})
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyData
                text="나만의 멋진 그룹을 만들어보세요"
                subText="대화의 장을 열고 재미있는 이야기를 나눠볼까요?"
              />
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    flex: 1,
    flexGrow: 1,
    backgroundColor: COLORS.background, // 배경 통일
  },
  bottomRightButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary, // 테라코타 포인트
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    // 프리미엄 소프트 섀도우
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 100, // FAB와 겹치지 않도록 여백 확보
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
})
