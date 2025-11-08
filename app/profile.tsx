import AppDrawer, { AppDrawerRef } from "@/components/AppDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { Href, useRouter } from "expo-router";
import { useRef } from "react";
import { ScrollView, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const drawerRef = useRef<AppDrawerRef>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login" as Href);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppDrawer
        ref={drawerRef}
        onProfilePress={() => {
          // Ya estamos en perfil
        }}
        onHomePress={() => {
          router.push("/home" as Href);
        }}
        onBookmarksPress={() => {
          // TODO: Navegar a la pantalla de marcadores cuando esté disponible
          console.log("Navegar a Marcadores");
        }}
        onHistoryPress={() => {
          // TODO: Navegar a la pantalla de historial cuando esté disponible
          console.log("Navegar a Historial");
        }}
      />

      <Appbar.Header mode="small">
        <Appbar.Action
          icon="menu"
          onPress={() => drawerRef.current?.open()}
          accessibilityLabel="Menu"
        />
        <Appbar.Content title="Perfil" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <Avatar.Text
            size={100}
            label={user ? getInitials(user.name) : "U"}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text
            variant="headlineMedium"
            style={{
              marginTop: 16,
              fontWeight: "bold",
              color: theme.colors.onBackground,
            }}
          >
            {user?.name || "Usuario"}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              marginTop: 4,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            {user?.email || ""}
          </Text>
        </View>

        <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Información Personal
            </Text>
            <Divider style={{ marginBottom: 16 }} />
            <List.Item
              title="Nombre"
              description={user?.name || "No disponible"}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="Email"
              description={user?.email || "No disponible"}
              left={(props) => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Rol"
              description={user?.role || "No disponible"}
              left={(props) => <List.Icon {...props} icon="shield-account" />}
            />
            <List.Item
              title="ID de Usuario"
              description={user?.id ? String(user.id) : "No disponible"}
              left={(props) => <List.Icon {...props} icon="identifier" />}
            />
          </Card.Content>
        </Card>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleSignOut}
            style={{ marginBottom: 8 }}
            buttonColor={theme.colors.error}
          >
            Cerrar Sesión
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
