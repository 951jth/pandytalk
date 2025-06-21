import React, {useState} from 'react'
import {Image, ImageProps, TouchableOpacity, View} from 'react-native'
import EnhancedImageViewing from 'react-native-image-viewing'

interface ImageSource {
  uri: string
}

interface propTypes {
  images: ImageSource[]
  imageProps?: ImageProps
  index?: number
  setIndex?: (number: number) => void
}

export default function ImageViewer({
  images,
  index = 0,
  imageProps,
  setIndex,
}: propTypes) {
  const [visible, setVisible] = useState(false)

  if (!images?.[0]?.uri) return null

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image {...imageProps} source={{uri: images[0].uri}} />
      </TouchableOpacity>

      <EnhancedImageViewing
        images={images}
        imageIndex={index}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      />
    </View>
  )
}
