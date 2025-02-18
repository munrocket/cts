import { assert, unreachable } from '../../../common/util/util.js';

import { runRefTest } from './gpu_ref_test.js';

// <canvas> element from html page
declare const cvs: HTMLCanvasElement;

export function run(format: GPUTextureFormat, compositingAlphaMode: GPUCanvasCompositingAlphaMode) {
  runRefTest(async t => {
    const ctx = cvs.getContext('webgpu');
    assert(ctx !== null, 'Failed to get WebGPU context from canvas');

    switch (format) {
      case 'bgra8unorm':
      case 'bgra8unorm-srgb':
      case 'rgba8unorm':
      case 'rgba8unorm-srgb':
        break;
      default:
        unreachable();
    }

    // This is mimic globalAlpha in 2d context blending behavior
    const a = compositingAlphaMode === 'opaque' ? (1.0).toFixed(1) : (0.5).toFixed(1);

    ctx.configure({
      device: t.device,
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      compositingAlphaMode,
    });

    const pipeline = t.device.createRenderPipeline({
      vertex: {
        module: t.device.createShaderModule({
          code: `
struct VertexOutput {
[[builtin(position)]] Position : vec4<f32>;
[[location(0)]] fragColor : vec4<f32>;
};

[[stage(vertex)]]
fn main([[builtin(vertex_index)]] VertexIndex : u32) -> VertexOutput {
var pos = array<vec2<f32>, 6>(
    vec2<f32>( 0.75,  0.75),
    vec2<f32>( 0.75, -0.75),
    vec2<f32>(-0.75, -0.75),
    vec2<f32>( 0.75,  0.75),
    vec2<f32>(-0.75, -0.75),
    vec2<f32>(-0.75,  0.75));

var offset = array<vec2<f32>, 4>(
vec2<f32>( -0.125,  0.125),
vec2<f32>( 0.125, 0.125),
vec2<f32>(-0.125, -0.125),
vec2<f32>( 0.125,  -0.125));

var color = array<vec4<f32>, 4>(
    vec4<f32>(0.49804, 0.0, 0.0, ${a}),
    vec4<f32>(0.0, 0.49804, 0.0, ${a}),
    vec4<f32>(0.0, 0.0, 0.49804, ${a}),
    vec4<f32>(0.49804, 0.49804, 0.0, ${a})); // 0.49804 -> 0x7f

var output : VertexOutput;
output.Position = vec4<f32>(pos[VertexIndex % 6u] + offset[VertexIndex / 6u], 0.0, 1.0);
output.fragColor = color[VertexIndex / 6u];
return output;
}
        `,
        }),
        entryPoint: 'main',
      },
      fragment: {
        module: t.device.createShaderModule({
          code: `
[[stage(fragment)]]
fn main([[location(0)]] fragColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
return fragColor;
}
        `,
        }),
        entryPoint: 'main',
        targets: [
          {
            format,
            blend:
              compositingAlphaMode === 'opaque'
                ? undefined
                : {
                    // The blending behavior here is to mimic 2d context blending behavior
                    // of drawing rects in order
                    // https://drafts.fxtf.org/compositing/#porterduffcompositingoperators_srcover
                    color: {
                      srcFactor: 'src-alpha',
                      dstFactor: 'one-minus-src-alpha',
                      operation: 'add',
                    },
                    alpha: {
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                      operation: 'add',
                    },
                  },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),

          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          storeOp: 'store',
        },
      ],
    };

    const commandEncoder = t.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.draw(6, 1, 6, 0);
    passEncoder.draw(6, 1, 12, 0);
    passEncoder.draw(6, 1, 18, 0);
    passEncoder.endPass();
    t.device.queue.submit([commandEncoder.finish()]);
  });
}
