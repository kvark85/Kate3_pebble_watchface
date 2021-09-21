#include <pebble.h>

// 144×168

// Declare globally
static Window *s_window;
static TextLayer *s_text_time_layer;
static TextLayer *s_text_weather_layer;

static GBitmap *s_background_bitmap;
static BitmapLayer *s_background_layer;

static char temperature_buffer[8];

void in_received_handler(DictionaryIterator *received, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "(C) Received message from JS file");
  Tuple *temperature = dict_find(received, MESSAGE_KEY_WeatherTemperature);
  if (temperature) {
    text_layer_set_text(s_text_weather_layer, temperature->value->cstring);
  }
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);

  // Create background
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND);
  s_background_layer = bitmap_layer_create(GRect(0, 0, 144, 168));
  bitmap_layer_set_bitmap(s_background_layer, s_background_bitmap);
  layer_add_child(window_layer, bitmap_layer_get_layer(s_background_layer));

  // create time layer - this is where time goes
  s_text_time_layer = text_layer_create(GRect(2, 0-2, 65, 28));
  text_layer_set_text_alignment(s_text_time_layer, GTextAlignmentCenter);
  text_layer_set_background_color(s_text_time_layer, GColorClear);
  text_layer_set_text_color(s_text_time_layer, GColorBlack);
  // text_layer_set_background_color(s_text_time_layer, GColorBlack);
  // text_layer_set_text_color(s_text_time_layer, GColorWhite);
  text_layer_set_font(s_text_time_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  layer_add_child(window_layer, text_layer_get_layer(s_text_time_layer));

  // create weather layer - this is where the date goes
  s_text_weather_layer = text_layer_create(GRect(2, 28-2, 65, 18));
  text_layer_set_text_alignment(s_text_weather_layer, GTextAlignmentCenter);
  text_layer_set_background_color(s_text_weather_layer, GColorClear);
  text_layer_set_text_color(s_text_weather_layer, GColorBlack);
  // text_layer_set_background_color(s_text_weather_layer, GColorBlack);
  // text_layer_set_text_color(s_text_weather_layer, GColorWhite);
  text_layer_set_font(s_text_weather_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_text(s_text_weather_layer, "Load");
  layer_add_child(window_layer, text_layer_get_layer(s_text_weather_layer));
}

static void main_window_unload(Window *window) {
  // destroy the text layers - this is good
  text_layer_destroy(s_text_time_layer);
  text_layer_destroy(s_text_weather_layer);

  // destroy the image layers
  gbitmap_destroy(s_background_bitmap);
  layer_remove_from_parent(bitmap_layer_get_layer(s_background_layer));
  bitmap_layer_destroy(s_background_layer);
}

static void update_time() {
  // Get a tm structure
  time_t temp = time(NULL);
  struct tm *tick_time = localtime(&temp);

  // Write the current hours and minutes into a buffer
  static char s_buffer[8];
  strftime(s_buffer, sizeof(s_buffer), clock_is_24h_style() ?
                                          "%H:%M" : "%I:%M", tick_time);

  // Display this time on the TextLayer
  text_layer_set_text(s_text_time_layer, s_buffer);
}

static void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
  update_time();
}

static void init(void) {
  s_window = window_create();

  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload,
  });
  const bool animated = true;
  window_stack_push(s_window, animated);

  update_time();

  // Register with TickTimerService
  tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);

  // App message init
  app_message_open(64, 16);
  app_message_register_inbox_received(in_received_handler);
}

static void deinit(void) {
  window_destroy(s_window);
}

int main(void) {
  init();

  APP_LOG(APP_LOG_LEVEL_DEBUG, "(C) Done initializing, pushed window: %p", s_window);

  app_event_loop();
  deinit();
}
