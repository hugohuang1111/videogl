
import { _decorator, Component, Node, Material, MeshRenderer, VideoClip, game, gfx, assetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VideoGL')
export class VideoGL extends Component {

    @property
    public videoURL: string = ""

    @property(VideoClip)
    public videoSource: VideoClip|null = null;

    private mat: Material|null = null;
    private static videoElement: any = null;
    private static videoTexture: gfx.Texture|null = null;
    private static videoTextureReady: boolean = false;
    private device: gfx.Device|null = null;

    start () {
        // @ts-ignore
        if (game._gfxDevice) {
            // @ts-ignore
            this.device = game._gfxDevice;

            this.createVideoTextureIf(this.device);

            if (this.videoURL.length > 0) {
                this.createVideoElementIf(this.videoURL);
            } else {
                const uuid = this.videoSource?._uuid;
                if (uuid) {
                    let resURL = assetManager.utils.getUrlWithUuid(uuid);
                    this.createVideoElementIf(resURL.replace('.json', '.mp4'));
                }
            }
        }
    }

    playVideo() {
        if (!document) {
            console.log('ERROR, not support this platform');
            return;
        }
    }

    createVideoElementIf(url: string) {
        console.log('VideoURL:' + url);
        if (0 == url.length) {
            return;
        }
        if (VideoGL.videoElement) {
            return VideoGL.videoElement;
        }

        const video = document.createElement('video');
        console.log('create video success ' + video);

        let playing = false;
        let timeupdate = false;
      
        video.autoplay = true;
        video.muted = true;
        video.loop = true;

        const self = this;
        function checkReady() {
            console.log('create ready check');
            if (playing && timeupdate) {
                console.log('create is ready ready');
                VideoGL.videoTextureReady = true;
            }
        }
        video.addEventListener('playing', function() {
           playing = true;
           checkReady();
        }, true);
      
        video.addEventListener('timeupdate', function() {
           timeupdate = true;
           checkReady();
        }, true);
      
        video.src = url;
        video.play();

        VideoGL.videoElement = video;

        return video;
    }

    createVideoTextureIf(device: any) {
        if (!device) {
            console.log('device is null');
            return;
        }
        if (VideoGL.videoTexture) {
            return VideoGL.videoTexture;
        }
        if (!device.gl) {
            return
        }
        const gl: WebGLRenderingContext = device.gl;
        let tex: gfx.Texture|null = null;
        tex = device.createTexture(new gfx.TextureInfo(
            gfx.TextureType.TEX2D,
            gfx.TextureUsageBit.SAMPLED | gfx.TextureUsageBit.TRANSFER_DST,
            gfx.Format.RGBA8,
            640,
            360,
        ));

        if (tex) {
            //@ts-ignore
            const gpuTexture = tex.gpuTexture;
            if (gpuTexture) {
                gpuTexture.glWrapS = gl.CLAMP_TO_EDGE;
                gpuTexture.glWrapT = gl.CLAMP_TO_EDGE;
                gpuTexture.glMinFilter = gl.LINEAR;
            }
        }
        VideoGL.videoTexture = tex;

        console.log('Video texture created');

        return tex;
    }

    updateVideoTexture() {
        if (!this.device) {
            return;
        }
        if (!VideoGL.videoTexture) {
            return;
        }
        if (!VideoGL.videoElement) {
            return;
        }
        const region = new gfx.BufferTextureCopy();
        region.texExtent.width = 640;
        region.texExtent.height = 360;
        region.texExtent.depth = 1;
        this.device.copyTexImagesToTexture([VideoGL.videoElement], VideoGL.videoTexture, [region]);

        const mr = this.node.getComponent(MeshRenderer);
        if (mr) {
            this.mat = mr.getMaterialInstance(0);
        }

        if (this.mat) {
            this.mat.setProperty('mainTexture', VideoGL.videoTexture, 0);
        }
    }

    update (deltaTime: number) {
        if (VideoGL.videoTextureReady) {
            this.updateVideoTexture();
        }
    }
}

