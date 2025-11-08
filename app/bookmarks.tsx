import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";

// Asegúrate de que este archivo importe y use fetchBookmarks y la nueva removeBookmark
import {
  apiToggleFavorite,
  apiToggleLike,
  fetchBookmarks,
} from "@/utils/apiService";

import { Href, router } from "expo-router";

import AppDrawer, { AppDrawerRef } from "@/components/AppDrawer";
import ArticleCard from "@/components/Card";

// Tipado corregido para reflejar el uso de views_count, category_name, etc.
type BookmarkArticle = {
  id: string;
  title: string;
  summary: string;
  category: string;
  image_url: string;
  views: string; // Formato string (e.g., "1.2k")
  isBookmarked: boolean;
  likes: number;
};

const formatViews = (count: number) => {
  return count > 999 ? (count / 1000).toFixed(1) + "k" : String(count);
};

const BookmarksScreen = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false); // Nuevo estado para remoción
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [sortConfig, setSortConfig] = useState({
    sort: "published_at",
    order: "desc" as "asc" | "desc",
  });

  const theme = useTheme();
  const drawerRef = useRef<AppDrawerRef>(null);

  const loadBookmarks = async (pageToLoad: number = 1) => {
    if (pageToLoad === 1) setIsLoading(true);

    try {
      const data = await fetchBookmarks({
        page: pageToLoad,
        sort: sortConfig.sort,
        order: sortConfig.order,
      });

      if (!data) return;

      const apiArticles: any[] = data.articles || [];
      const mappedArticles: BookmarkArticle[] = apiArticles.map((a: any) => ({
        ...a,
        id: String(a.id),
        views: formatViews(a.views_count || a.views || 0),
        category: a.category_name || a.category || "",
        image_url: a.image_url || "https://placehold.co/600x400/png",
        isBookmarked: a.is_favorite || true, // En esta pantalla, asumimos true
        likes: a.likes_count || 0,
      }));

      setBookmarks(
        pageToLoad === 1 ? mappedArticles : [...bookmarks, ...mappedArticles]
      );
      setPagination(
        data.pagination || { page: 1, total: mappedArticles.length, pages: 1 }
      );
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudieron cargar los favoritos."
      );
      if (pageToLoad === 1) setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks(1);
  }, [sortConfig]);

  // --- HANDLERS DE INTERACCIÓN ---

  const handleCardPress = (id: string) => {
    // Lógica para navegar al detalle del artículo
    console.log(`Navegando a detalle de artículo: ${id}`);
    router.push(`/article/${id}` as Href);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await apiToggleFavorite(id);

      if (response.success) {
        const newFavoriteState: boolean = response.data?.is_favorite;

        if (typeof newFavoriteState === "boolean") {
          setBookmarks((prevBookmarks) => {
            if (newFavoriteState === false) {
              return prevBookmarks.filter((article) => article.id !== id);
            } else {
              return prevBookmarks.map((article) =>
                article.id === id ? { ...article, isBookmarked: true } : article
              );
            }
          });
        }
      }
    } catch (e: any) {
      console.error("Error toggling favorite:", e);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const response = await apiToggleLike(id);
      if (response.success) {
        const newLikesCount =
          response.data?.likes_count ?? response.likes_count;

        if (newLikesCount !== undefined) {
          setBookmarks((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    // USAMOS DIRECTAMENTE EL VALOR DEL SERVIDOR
                    likes: newLikesCount,
                  }
                : a
            )
          );
        }
      }
    } catch (e: any) {
      console.error("Error toggling like:", e);
      window.alert("Error al actualizar like: " + e.message);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="bookmark-off-outline"
        size={60}
        iconColor={theme.colors.backdrop}
      />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        ¡Aún no tienes artículos guardados!
      </Text>
      <Text style={styles.emptyText}>
        Guarda tus noticias favoritas para leerlas después o tenerlas a mano.
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push("/home" as Href)}
        style={styles.browseButton}
      >
        Explorar Noticias
      </Button>
    </View>
  );

  const renderItem = ({ item }: { item: BookmarkArticle }) => (
    <ArticleCard
      id={item.id.toString()}
      title={item.title}
      summary={item.summary}
      category={item.category}
      imageUrl={item.image_url}
      views={item.views}
      likes={item.likes}
      isBookmarked={item.isBookmarked}
      onPress={() => handleCardPress(item.id)}
      onToggleFavorite={handleToggleFavorite}
      onToggleLike={handleToggleLike}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppDrawer
        ref={drawerRef}
        onProfilePress={() => {
          router.push("/profile" as Href);
        }}
        onHomePress={() => {
          router.push("/home" as Href);
        }}
        onHistoryPress={() => {
          console.log("Navegar a Historial");
        }}
      />

      <Appbar.Header mode="small">
        <Appbar.Action
          icon="menu"
          onPress={() => drawerRef.current?.open()}
          accessibilityLabel="Menu"
        />
        <Appbar.Content title="Guardados" />
        <Appbar.Action
          icon="refresh"
          onPress={() => loadBookmarks(1)} // Llama a la carga de la página 1
          disabled={isLoading || isRemoving}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {isLoading || isRemoving ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" />
            <Text style={{ marginTop: 10, color: theme.colors.onSurface }}>
              {isLoading ? "Cargando favoritos..." : "Quitando de la lista..."}
            </Text>
          </View>
        ) : bookmarks.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 14,
    color: "#666",
  },
  browseButton: {
    marginTop: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

export default BookmarksScreen;
