import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { logger } from '../../../shared/services/logger';

/**
 * HarnessScreen
 * 신규 기능이나 컴포넌트를 독립적으로 테스트하기 위한 실험용 화면입니다.
 */
const HarnessScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="테스트 하네스 (Laboratory)" subtitle="신규 기능을 여기서 먼저 테스트하세요." />
        <Card.Content>
          <Text variant="bodyMedium">
            이 화면은 프로젝트의 실제 UI에 영향을 주지 않고 새로운 컴포넌트나 로직을 실험해볼 수 있는 공간입니다.
          </Text>
          {/* 업데이트 로거 테스트 섹션 */}
          <View style={[styles.testSection, { marginTop: 20 }]}>
            <Text variant="labelLarge" style={{ marginBottom: 10 }}>Logger & Updates Test</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
              <Button 
                mode="outlined" 
                onPress={() => logger.logUpdateCheck({ type: 'downloaded', message: 'Harness Test Success' })}
              >
                성공 로그
              </Button>
              <Button 
                mode="contained" 
                buttonColor="#B00020"
                onPress={() => logger.logUpdateCheck({ type: 'error_check', message: 'Harness Simulated Error' })}
              >
                에러 로그
              </Button>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* 실험하고 싶은 컴포넌트를 여기에 추가하세요 */}
          <View style={styles.testSection}>
            <Text variant="labelLarge">기타 테스트 영역</Text>
            <Button 
              mode="contained" 
              onPress={() => console.log('Harness Test Clicked!')}
              style={styles.button}
            >
              테스트 버튼
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  testSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  button: {
    marginTop: 10,
  },
});

export default HarnessScreen;
