#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PDFScannerModule, NSObject)

RCT_EXTERN_METHOD(buscarCantoEnPDF:(NSString *)nombreCanto
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
