import COLORS from '@shared/constants/color'
import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {IconButton} from 'react-native-paper'

import ImageViewer from '@app/shared/ui/common/ImageViewer'

interface ImagePreviewProps {
  uri: string
  onRemove: () => void
}

export default function ImagePreview({uri, onRemove}: ImagePreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <ImageViewer
          images={[{uri}]}
          style={styles.image}
          imageProps={{style: styles.image}}
        />
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <IconButton
            icon="close-circle"
            iconColor={COLORS.error || '#FF0000'}
            size={20}
            style={styles.removeIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  imageWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    margin: 0,
    padding: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 20,
    height: 20,
  },
})
