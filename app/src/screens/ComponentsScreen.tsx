/**
 * Components Screen - UI component showcase and demo screen
 * Displays all reusable UI components with example configurations
 * Use this screen for testing and development reference
 */
import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, withOpacity } from "@/themes";
import {
  Text,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Modal,
  Dialog,
  Toast,
  Badge,
  Avatar,
  AvatarGroup,
  Divider,
  Switch,
  Checkbox,
} from "@/components/ui";

/**
 * Section component for grouping demo items
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text variant="h4" className="mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Components Screen - showing all UI components for reference
 */
export function ComponentsScreen() {
  const insets = useSafeAreaInsets();

  // State for interactive demos
  const [modalVisible, setModalVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "warning" | "info">("success");
  const [inputValue, setInputValue] = useState("");
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);

  const showToast = (variant: "success" | "error" | "warning" | "info") => {
    setToastVariant(variant);
    setToastVisible(true);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Orange status bar area */}
      <View
        style={{
          backgroundColor: colors.primary[500],
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
      >
        <View className="mt-4">
          <Text
            variant="h2"
            className="font-bold"
            style={{ color: colors.white }}
          >
            Components
          </Text>
          <Text
            variant="body-sm"
            style={{ color: withOpacity(colors.white, 0.8) }}
          >
            UI Component Library
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Typography Section */}
        <Section title="Typography">
          <Card variant="outlined" className="gap-2">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="h4">Heading 4</Text>
            <Text variant="body">Body text - regular</Text>
            <Text variant="body-sm">Body small text</Text>
            <Text variant="caption" color="muted">Caption text</Text>
            <Text variant="label">Label text</Text>
            <View className="flex-row gap-2 flex-wrap mt-2">
              <Text color="primary">Primary</Text>
              <Text color="success">Success</Text>
              <Text color="warning">Warning</Text>
              <Text color="error">Error</Text>
            </View>
          </Card>
        </Section>

        {/* Button Section */}
        <Section title="Buttons">
          <Card variant="outlined" className="gap-3">
            <Text variant="label" color="secondary">Variants</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </View>

            <Text variant="label" color="secondary" className="mt-2">Sizes</Text>
            <View className="flex-row items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </View>

            <Text variant="label" color="secondary" className="mt-2">States</Text>
            <View className="flex-row gap-2">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </View>

            <Text variant="label" color="secondary" className="mt-2">Full Width</Text>
            <Button fullWidth>Full Width Button</Button>
          </Card>
        </Section>

        {/* Input Section */}
        <Section title="Inputs">
          <Card variant="outlined" className="gap-4">
            <Input
              label="Default Input"
              placeholder="Enter text..."
              value={inputValue}
              onChangeText={setInputValue}
            />
            <Input
              variant="filled"
              label="Filled Input"
              placeholder="Filled variant..."
            />
            <Input
              variant="underlined"
              label="Underlined Input"
              placeholder="Underlined variant..."
            />
            <Input
              label="With Error"
              placeholder="Error state..."
              error="This field is required"
            />
            <Input
              label="With Helper"
              placeholder="Helper text..."
              helperText="This is helper text"
            />
            <Input
              label="Disabled"
              placeholder="Disabled..."
              disabled
            />
          </Card>
        </Section>

        {/* Card Section */}
        <Section title="Cards">
          <View className="gap-3">
            <Card variant="elevated">
              <CardHeader>
                <Text variant="h4">Elevated Card</Text>
              </CardHeader>
              <CardContent>
                <Text color="secondary">
                  This card has a shadow for elevation effect.
                </Text>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="ghost">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <Text variant="h4">Outlined Card</Text>
              </CardHeader>
              <CardContent>
                <Text color="secondary">
                  This card has a border instead of shadow.
                </Text>
              </CardContent>
            </Card>

            <Card variant="filled">
              <CardHeader>
                <Text variant="h4">Filled Card</Text>
              </CardHeader>
              <CardContent>
                <Text color="secondary">
                  This card has a filled background.
                </Text>
              </CardContent>
            </Card>
          </View>
        </Section>

        {/* Badge Section */}
        <Section title="Badges">
          <Card variant="outlined">
            <View className="flex-row flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </View>
            <View className="flex-row items-center gap-2 mt-3">
              <Badge size="sm" variant="primary">Small</Badge>
              <Badge size="md" variant="primary">Medium</Badge>
              <Badge size="lg" variant="primary">Large</Badge>
            </View>
          </Card>
        </Section>

        {/* Avatar Section */}
        <Section title="Avatars">
          <Card variant="outlined">
            <Text variant="label" color="secondary" className="mb-2">Sizes</Text>
            <View className="flex-row items-center gap-3">
              <Avatar size="xs" initials="XS" />
              <Avatar size="sm" initials="SM" />
              <Avatar size="md" initials="MD" />
              <Avatar size="lg" initials="LG" />
              <Avatar size="xl" initials="XL" />
            </View>

            <Text variant="label" color="secondary" className="mt-4 mb-2">Avatar Group</Text>
            <AvatarGroup
              avatars={[
                { initials: "JD" },
                { initials: "AS", bgColor: "bg-secondary-100", textColor: "text-secondary-700" },
                { initials: "MK", bgColor: "bg-success-light", textColor: "text-success" },
                { initials: "RB", bgColor: "bg-warning-light", textColor: "text-warning" },
                { initials: "EF" },
                { initials: "GH" },
              ]}
              max={4}
            />
          </Card>
        </Section>

        {/* Switch & Checkbox Section */}
        <Section title="Toggles">
          <Card variant="outlined" className="gap-4">
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              label="Switch with label"
            />
            <View className="flex-row items-center gap-4">
              <Switch value={false} onValueChange={() => {}} size="sm" />
              <Switch value={true} onValueChange={() => {}} size="md" />
              <Switch value={true} onValueChange={() => {}} size="lg" />
            </View>

            <Divider margin="my-2" />

            <Checkbox
              checked={checkboxValue}
              onCheckedChange={setCheckboxValue}
              label="Checkbox with label"
            />
            <View className="flex-row items-center gap-4">
              <Checkbox checked={false} onCheckedChange={() => {}} size="sm" />
              <Checkbox checked={true} onCheckedChange={() => {}} size="md" />
              <Checkbox checked={true} onCheckedChange={() => {}} size="lg" />
            </View>
          </Card>
        </Section>

        {/* Divider Section */}
        <Section title="Dividers">
          <Card variant="outlined">
            <Text color="secondary">Content above</Text>
            <Divider margin="my-3" />
            <Text color="secondary">Content below</Text>
            <Divider label="OR" margin="my-3" />
            <Text color="secondary">Content with label</Text>
          </Card>
        </Section>

        {/* Modal & Dialog Section */}
        <Section title="Modals & Dialogs">
          <Card variant="outlined" className="gap-3">
            <Button onPress={() => setModalVisible(true)}>Open Modal</Button>
            <Button variant="outline" onPress={() => setDialogVisible(true)}>
              Open Dialog
            </Button>
          </Card>
        </Section>

        {/* Toast Section */}
        <Section title="Toasts">
          <Card variant="outlined">
            <View className="flex-row flex-wrap gap-2">
              <Button
                size="sm"
                bgColor="bg-success"
                onPress={() => showToast("success")}
              >
                Success
              </Button>
              <Button
                size="sm"
                bgColor="bg-error"
                onPress={() => showToast("error")}
              >
                Error
              </Button>
              <Button
                size="sm"
                bgColor="bg-warning"
                onPress={() => showToast("warning")}
              >
                Warning
              </Button>
              <Button
                size="sm"
                bgColor="bg-info"
                onPress={() => showToast("info")}
              >
                Info
              </Button>
            </View>
          </Card>
        </Section>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Example Modal"
      >
        <Text color="secondary">
          This is a modal dialog that can contain any content. It supports
          scrolling for longer content and can be customized with various props.
        </Text>
        <View className="mt-4">
          <Button fullWidth onPress={() => setModalVisible(false)}>
            Close Modal
          </Button>
        </View>
      </Modal>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action? This cannot be undone."
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => {
          setDialogVisible(false);
          showToast("success");
        }}
      />

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={`This is a ${toastVariant} message!`}
        variant={toastVariant}
        onHide={() => setToastVisible(false)}
        actionText="Dismiss"
        onAction={() => setToastVisible(false)}
      />
    </View>
  );
}
