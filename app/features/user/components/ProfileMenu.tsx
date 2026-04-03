import {useProfileMenu} from '@app/features/user/hooks/useProfileMenu'
import {CustomMenu} from '@app/shared/ui/menu/CustomMenu'
import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'

interface ProfileMenuProps {
  onReset: () => void
  style?: StyleProp<ViewStyle>
  anchorStyle?: StyleProp<ViewStyle>
}

/**
 * 유저 프로필 전용 자율형 드랍다운 메뉴 컴포넌트
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onReset,
  style,
  anchorStyle,
}) => {
  // ✅ 훅에서 userInfo와 완성된 menuItems까지 직접 가져옴
  const {menuItems, menuVisible, openMenu, closeMenu} = useProfileMenu(onReset)

  return (
    <CustomMenu
      visible={menuVisible}
      onOpen={openMenu}
      onClose={closeMenu}
      items={menuItems} // ✅ 훅이 준 리스트 그대로 사용
      anchorStyle={anchorStyle}
      style={style}
    />
  )
}

export default ProfileMenu
