import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Card, Chip, IconButton, Text, useTheme } from "react-native-paper";

type ArticleCardProps = {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  views: string;
  likes: number;
  isBookmarked: boolean;
  onPress?: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleLike: (id: string) => void;
};

const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  title,
  summary,
  category,
  imageUrl,
  views,
  likes,
  isBookmarked,
  onPress,
  onToggleFavorite,
  onToggleLike,
}) => {
  const theme = useTheme();

  return (
    <Card key={id} mode="outlined" style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
        onError={(e) =>
          console.error("Error loading image:", e.nativeEvent.error)
        }
      />

      <View style={styles.textContainer}>
        <View style={styles.chipContainer}>
          <Chip
            compact
            mode="flat"
            style={{ backgroundColor: theme.colors.primaryContainer }}
          >
            <Text
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: "bold",
                fontSize: 10,
              }}
            >
              {category}
            </Text>
          </Chip>
        </View>

        <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.summary} numberOfLines={3}>
          {summary}
        </Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <IconButton
              icon="eye-outline"
              size={16}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => {}}
              style={styles.iconButton}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {views}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <IconButton
              icon="heart-outline"
              size={16}
              iconColor={theme.colors.error}
              onPress={() => onToggleLike(id)}
              style={styles.iconButton}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {likes}
            </Text>
          </View>

          <IconButton
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            iconColor={
              isBookmarked
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
            onPress={() => onToggleFavorite(id)}
            style={styles.bookmarkButton}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  textContainer: {
    flex: 1,
    padding: 16,
  },
  chipContainer: {
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  summary: {
    opacity: 0.8,
    marginBottom: 8,
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "flex-start",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metricText: {
    fontSize: 12,
    color: "#666",
    marginLeft: -8,
  },
  iconButton: {
    margin: 0,
    padding: 0,
  },
  bookmarkButton: {
    marginLeft: "auto",
    margin: 0,
    padding: 0,
    height: 20,
    width: 20,
  },
});

export default ArticleCard;
