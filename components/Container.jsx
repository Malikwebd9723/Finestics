import { SafeAreaView } from 'react-native';

export const Container = ({ children }) => {
  return <SafeAreaView className={styles.container}>{children}</SafeAreaView>;
};

const styles = {
  container: 'flex flex-1 m-6',
};
