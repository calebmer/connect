#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <ReactNativeNavigation/ReactNativeNavigation.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];

  [ReactNativeNavigation bootstrap:[self sourceURL]
                     launchOptions:launchOptions
             bridgeManagerDelegate:self];

  return YES;
}

- (NSURL *)sourceURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"app/src/main" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self sourceURL];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  return [_moduleRegistryAdapter extraModulesForBridge:bridge andExperience:nil];
}

@end
